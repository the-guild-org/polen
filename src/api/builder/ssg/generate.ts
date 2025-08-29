import type { Config } from '#api/config/$'
import { Routes } from '#api/routes/$'
import { chunk } from '#lib/kit-temp'
import { debugPolen } from '#singletons/debug'
import { Worker } from '@effect/platform'
import { NodeContext, NodeWorker } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@wollybeard/kit'
import consola from 'consola'
import { Effect, Layer } from 'effect'
import getPort from 'get-port'
import { cpus, totalmem } from 'node:os'
import {
  GeneratePagesMessage,
  type GenerateResult,
  type PageMessage,
  type ServerMessage,
  StartServerMessage,
} from './worker-messages.js'
import { createPageSpawner, createServerSpawner } from './worker-spawners.js'

const debug = debugPolen.sub(`api:ssg:generate`)

export const generate = (config: Config.Config): Effect.Effect<void, Error, FileSystem> =>
  Effect.gen(function*() {
    // Read routes from the manifest generated during build
    const manifest = yield* Routes.Manifest.get(config.paths.project.absolute.build.assets.root)
    const routes = manifest.routes

    const totalRoutes = routes.length

    // Optimize worker count based on system and workload
    const cpuCount = cpus().length
    const memoryGB = totalmem() / (1024 ** 3)

    // Scale workers based on both CPU and memory (SSG is memory intensive)
    const maxWorkersByCPU = Math.max(1, cpuCount - 1)
    const maxWorkersByMemory = Math.floor(memoryGB / 2) // ~2GB per worker
    const optimalWorkers = Math.min(maxWorkersByCPU, maxWorkersByMemory, 8)

    // Dynamic batch sizing for better load distribution
    const minBatchSize = 10
    const idealBatchesPerWorker = 3 // Better work stealing
    const batchSize = Math.max(minBatchSize, Math.ceil(totalRoutes / (optimalWorkers * idealBatchesPerWorker)))
    const batches = chunk(routes, batchSize)

    consola.info(`SSG Build Plan:`)
    consola.info(`   Routes: ${totalRoutes} pages to generate`)
    consola.info(`   Servers: ${optimalWorkers} Polen app instances (to handle requests)`)
    consola.info(`   Clients: ${optimalWorkers} page generators (to capture HTML)`)
    consola.info(`   Distribution: ${batches.length} batches × ~${batchSize} pages each`)
    consola.info(`   System: ${cpuCount} CPUs, ${memoryGB.toFixed(1)}GB RAM`)

    debug(`SSG configuration`, {
      totalRoutes,
      optimalWorkers,
      cpuCount,
      memoryGB,
      batchSize,
      totalBatches: batches.length,
    })

    // Create worker spawner layers
    const serverPath = config.paths.project.absolute.build.serverEntrypoint
    const serverRunnerPath = Path.join(
      config.paths.framework.sourceDir,
      'api/builder/ssg/server-runner.worker' + config.paths.framework.sourceExtension,
    )

    const pageGeneratorPath = Path.join(
      config.paths.framework.sourceDir,
      'api/builder/ssg/page-generator.worker' + config.paths.framework.sourceExtension,
    )

    debug(`Creating worker pools with ${optimalWorkers} workers each`)

    // Create and use worker pools within a scoped context
    yield* Effect.scoped(
      Effect.gen(function*() {
        // Create the worker pools
        const serverPool = yield* Worker.makePoolSerialized<ServerMessage>({
          size: optimalWorkers,
        })

        const pagePool = yield* Worker.makePoolSerialized<PageMessage>({
          size: optimalWorkers,
          concurrency: 1, // One batch at a time per worker
        })

        const serverPorts: number[] = []

        consola.info(`\nStarting SSG infrastructure:`)
        consola.info(`   Launching ${optimalWorkers} Polen app instances...`)
        debug(`Finding available ports for servers`)

        // Get available ports
        for (let i = 0; i < optimalWorkers; i++) {
          const port = yield* Effect.tryPromise({
            try: () => getPort(),
            catch: (error) => new Error(`Failed to get port: ${error}`),
          })
          serverPorts.push(port)
        }
        debug(`Using ports:`, serverPorts)

        // Start servers using Effect
        yield* Effect.all(
          serverPorts.map((port) =>
            serverPool.executeEffect(
              new StartServerMessage({
                serverPath,
                port,
              }),
            )
          ),
          { concurrency: 'unbounded' },
        )
        consola.success(`   All ${optimalWorkers} app instances ready on ports: ${serverPorts.join(', ')}`)
        debug(`All servers started successfully`)

        // Prepare page generation configs
        // Each batch is assigned to a server in round-robin fashion
        const generateConfigs = batches.map((batch, index) => {
          const assignedPort = serverPorts[index % serverPorts.length]!
          debug(`Batch ${index + 1}: ${batch.length} routes → server on port ${assignedPort}`)
          return {
            batch,
            assignedPort,
            index,
          }
        })

        consola.info(`\nRoute distribution:`)
        consola.info(`   Each client processes ~${Math.ceil(batches.length / optimalWorkers)} batches`)
        consola.info(`   Routes are distributed round-robin across ${optimalWorkers} servers`)

        // Process batches
        consola.info(`\nGenerating pages...`)
        const startTime = Date.now()
        let completedBatches = 0
        let totalPagesProcessed = 0

        // Process batches using Effect.forEach
        const results = yield* Effect.forEach(
          generateConfigs,
          ({ batch, assignedPort, index }) =>
            pagePool
              .executeEffect(
                new GeneratePagesMessage({
                  routes: batch,
                  serverPort: assignedPort,
                  outputDir: config.paths.project.absolute.build.root,
                }),
              )
              .pipe(
                Effect.tap((result) =>
                  Effect.sync(() => {
                    completedBatches++
                    totalPagesProcessed += result.processedCount

                    const elapsed = (Date.now() - startTime) / 1000
                    const pagesPerSec = elapsed > 0 ? (totalPagesProcessed / elapsed).toFixed(1) : '0'
                    const progress = Math.floor((completedBatches / batches.length) * 100)

                    process.stdout.write(
                      `\r   Progress: ${completedBatches}/${batches.length} batches (${progress}%) • ${totalPagesProcessed}/${totalRoutes} pages • ${pagesPerSec} pages/s`,
                    )
                  })
                ),
                Effect.catchAll((error) => {
                  consola.error(`\nBatch ${index} failed:`, error)
                  debug(`Batch ${index} error details`, { error, batch })
                  return Effect.fail(new Error(`Batch ${index} failed: ${error}`))
                }),
              ),
          {
            concurrency: optimalWorkers,
            concurrentFinalizers: true,
          },
        )

        const successfulResults = results.filter((r) => r.success)

        // Final stats using successful results
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
        const totalMemoryMB = successfulResults.reduce((sum, r) => sum + r.memoryUsed, 0) / (1024 * 1024)
        const avgTimePerBatch = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length
          / 1000

        consola.success(`\n\nSSG Complete!`)
        consola.info(`   Generated: ${totalRoutes} pages in ${totalTime}s`)
        consola.info(`   Performance: ${(totalRoutes / parseFloat(totalTime)).toFixed(1)} pages/sec`)
        consola.info(`   Avg batch time: ${avgTimePerBatch.toFixed(1)}s`)
        consola.info(`   Peak memory: ${totalMemoryMB.toFixed(0)}MB`)

        debug(`SSG generation complete`, {
          totalTime,
          avgTimePerBatch,
          totalMemoryMB,
          successfulBatches: successfulResults.length,
        })
        // Cleanup happens automatically when the scope ends
        debug(`SSG generation complete, cleaning up resources`)
      }).pipe(
        // Provide all required layers
        Effect.provide(
          Layer.mergeAll(
            createServerSpawner(serverRunnerPath),
            createPageSpawner(pageGeneratorPath),
            NodeWorker.layerManager,
            NodeContext.layer,
          ),
        ),
      ),
    )

    consola.info('\nShutting down...')
    consola.success('Cleanup complete.')
    debug(`All resources cleaned up`)
  })
