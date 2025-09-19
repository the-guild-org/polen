import type { Config } from '#api/config/$'
import { Routes } from '#api/routes/$'
import { A, E } from '#dep/effect'
import { Worker } from '@effect/platform'
import { NodeContext, NodeWorker } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@wollybeard/kit'
import consola from 'consola'
import { Chunk, Duration, Effect, Layer, Ref } from 'effect'
import getPort from 'get-port'
import { cpus, totalmem } from 'node:os'
import { GeneratePagesMessage, PageMessage, ServerMessage, StartServerMessage } from './worker-messages.js'
import { createPageSpawner, createServerSpawner } from './worker-spawners.js'

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
    const batches = Chunk.toReadonlyArray(
      Chunk.map(
        Chunk.chunksOf(Chunk.fromIterable(routes), batchSize),
        batch => Chunk.toReadonlyArray(batch),
      ),
    )

    consola.info(`SSG Build Plan:`)
    consola.info(`   Routes: ${totalRoutes} pages to generate`)
    consola.info(`   Servers: ${optimalWorkers} Polen app instances (to handle requests)`)
    consola.info(`   Clients: ${optimalWorkers} page generators (to capture HTML)`)
    consola.info(`   Distribution: ${batches.length} batches × ~${batchSize} pages each`)
    consola.info(`   System: ${cpuCount} CPUs, ${memoryGB.toFixed(1)}GB RAM`)

    yield* Effect.logDebug(`SSG configuration`).pipe(
      Effect.annotateLogs({
        totalRoutes,
        optimalWorkers,
        cpuCount,
        memoryGB,
        batchSize,
        totalBatches: batches.length,
      }),
    )

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

    yield* Effect.logDebug(`Creating worker pools with ${optimalWorkers} workers each`)

    // Create and use worker pools within a scoped context
    yield* Effect.scoped(
      Effect.gen(function*() {
        // Create the server pool with its spawner
        const serverPool = yield* Worker.makePoolSerialized<ServerMessage>({
          size: optimalWorkers,
        }).pipe(
          Effect.provide(Layer.mergeAll(
            createServerSpawner(serverRunnerPath),
            NodeWorker.layerManager,
          )),
        )

        // Create the page pool with its spawner
        const pagePool = yield* Worker.makePoolSerialized<PageMessage>({
          size: optimalWorkers,
          concurrency: 1, // One batch at a time per worker
        }).pipe(
          Effect.provide(Layer.mergeAll(
            createPageSpawner(pageGeneratorPath),
            NodeWorker.layerManager,
          )),
        )

        const serverPorts: number[] = []

        consola.info(`\nStarting SSG infrastructure:`)
        consola.info(`   Launching ${optimalWorkers} Polen app instances...`)
        yield* Effect.logDebug(`Finding available ports for servers`)

        // Get available ports
        for (let i = 0; i < optimalWorkers; i++) {
          const port = yield* Effect.tryPromise({
            try: () => getPort(),
            catch: (error) => new Error(`Failed to get port: ${error}`),
          })
          serverPorts.push(port)
        }
        yield* Effect.logDebug(`Using ports: ${serverPorts.join(', ')}`)

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
        yield* Effect.logDebug(`All servers started successfully`)

        // Prepare page generation configs
        // Each batch is assigned to a server in round-robin fashion
        const generateConfigs = batches.map((batch, index) => {
          const assignedPort = serverPorts[index % serverPorts.length]!
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
        const completedBatchesRef = yield* Ref.make(0)
        const totalPagesProcessedRef = yield* Ref.make(0)

        // Process batches using Effect.all with timing
        const [elapsedTime, results] = yield* Effect.all(
          generateConfigs.map(({ batch, assignedPort, index }) =>
            pagePool
              .executeEffect(
                new GeneratePagesMessage({
                  routes: batch,
                  serverPort: assignedPort,
                  outputDir: config.paths.project.absolute.build.root,
                  ...(config.build.base ? { basePath: config.build.base } : {}),
                }),
              )
              .pipe(
                Effect.tap((result) =>
                  Effect.gen(function*() {
                    const completedBatches = yield* Ref.updateAndGet(completedBatchesRef, n => n + 1)
                    const totalPagesProcessed = yield* Ref.updateAndGet(totalPagesProcessedRef, n =>
                      n + result.processedCount)
                    // Still use process.stdout.write for progress bar - this is UI, not logging
                    const progress = Math.floor((completedBatches / batches.length) * 100)
                    yield* Effect.sync(() => {
                      process.stdout.write(
                        `\r   Progress: ${completedBatches}/${batches.length} batches (${progress}%) • ${totalPagesProcessed}/${totalRoutes} pages`,
                      )
                    })
                  })
                ),
                Effect.tapError((error) =>
                  Effect.logError(`Batch ${index} failed`).pipe(
                    Effect.annotateLogs({ error: String(error), batch }),
                  )
                ),
                Effect.map((result) => ({ ...result, batchIndex: index })),
                Effect.either, // Convert to Either to capture both success and failure
              )
          ),
          { concurrency: optimalWorkers },
        ).pipe(Effect.timed)

        // Partition results into successes and failures
        const [lefts, rights] = A.partition(results, E.isRight)
        const successfulResults = rights.map(r =>
          r.right
        )
        const failedBatches = lefts.map(r => ({
          error: r.left instanceof Error ? r.left.message : String(r.left),
        }))

        // Final stats using successful results
        const totalTime = (Duration.toMillis(elapsedTime) / 1000).toFixed(1)
        const actualPagesGenerated = yield* Ref.get(totalPagesProcessedRef)
        const totalFailures = totalRoutes - actualPagesGenerated

        if (successfulResults.length > 0) {
          const totalMemoryMB = A.reduce(successfulResults, 0, (sum, r) => sum + r.memoryUsed) / (1024 * 1024)
          const avgTimePerBatch = A.reduce(successfulResults, 0, (sum, r) => sum + r.duration)
            / successfulResults.length
            / 1000

          if (totalFailures === 0) {
            consola.success(`\n\nSSG Complete!`)
            consola.info(`   Generated: ${actualPagesGenerated} pages in ${totalTime}s`)
            consola.info(`   Performance: ${(actualPagesGenerated / parseFloat(totalTime)).toFixed(1)} pages/sec`)
            consola.info(`   Avg batch time: ${avgTimePerBatch.toFixed(1)}s`)
            consola.info(`   Peak memory: ${totalMemoryMB.toFixed(0)}MB`)
          } else {
            consola.warn(`\n\nSSG Completed with Errors`)
            consola.info(`   Generated: ${actualPagesGenerated} out of ${totalRoutes} pages`)
            consola.error(`   Failed: ${totalFailures} pages`)
            consola.info(`   Time: ${totalTime}s`)
            consola.info(`   Performance: ${(actualPagesGenerated / parseFloat(totalTime)).toFixed(1)} pages/sec`)
            consola.info(`   Avg batch time: ${avgTimePerBatch.toFixed(1)}s`)
            consola.info(`   Peak memory: ${totalMemoryMB.toFixed(0)}MB`)

            // Log details of failures from each batch
            const allFailures = successfulResults.flatMap(r => r.failures ?? [])
            if (allFailures.length > 0) {
              consola.error(`\n   Failed routes:`)
              for (const failure of allFailures.slice(0, 10)) {
                consola.error(`     - ${failure.route}: ${failure.error}`)
              }
              if (allFailures.length > 10) {
                consola.error(`     ... and ${allFailures.length - 10} more`)
              }
            }

            // Fail the effect to indicate error
            yield* Effect.fail(new Error(`SSG failed: ${totalFailures} pages could not be generated`))
          }
        } else {
          consola.error(`\n\nSSG Failed Completely`)
          consola.error(`   No pages were generated out of ${totalRoutes} total`)
          yield* Effect.fail(new Error(`SSG failed: No pages could be generated`))
        }

        yield* Effect.logDebug(`SSG generation complete`).pipe(
          Effect.annotateLogs({
            totalTime,
            successfulBatches: successfulResults.length,
          }),
        )
      }).pipe(
        // Provide NodeContext for Path service used in page generator
        Effect.provide(NodeContext.layer),
      ),
    ).pipe(
      // After scoped resources are released
      Effect.tap(() =>
        Effect.sync(() => {
          consola.info('\nShutting down...')
          consola.success('Cleanup complete.')
        })
      ),
      Effect.tap(() => Effect.logDebug(`All resources cleaned up`)),
    )
  })
