import type { Config } from '#api/config/$'
import { Routes } from '#api/routes/$'
import { Ar, Ef, Ei, Op } from '#dep/effect'
import { Worker } from '@effect/platform'
import { NodeContext, NodeWorker } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import { FsLoc } from '@wollybeard/kit'
import consola from 'consola'
import { Chunk, Duration, Layer, Ref } from 'effect'
import getPort from 'get-port'
import { cpus, totalmem } from 'node:os'
import { GeneratePagesMessage, PageMessage, ServerMessage, StartServerMessage } from './worker-messages.js'
import { createPageSpawner, createServerSpawner } from './worker-spawners.js'

export const generate = (config: Config.Config): Ef.Effect<void, Error, FileSystem> =>
  Ef.gen(function*() {
    // Read routes from the manifest generated during build
    const manifestOption = yield* Routes.Manifest.read(config.paths.project.absolute.build.assets.root)
    const manifest = yield* Op.match(manifestOption, {
      onNone: () => Ef.fail(new Error('Routes manifest not found. Ensure the build has completed successfully.')),
      onSome: Ef.succeed,
    })
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

    yield* Ef.logDebug(`SSG configuration`).pipe(
      Ef.annotateLogs({
        totalRoutes,
        optimalWorkers,
        cpuCount,
        memoryGB,
        batchSize,
        totalBatches: batches.length,
      }),
    )

    // Create worker spawner layers
    const serverPath = FsLoc.encodeSync(config.paths.project.absolute.build.serverEntrypoint)
    const serverRunnerPath = FsLoc.encodeSync(
      FsLoc.join(
        config.paths.framework.sourceDir,
        FsLoc.fromString(`api/builder/ssg/server-runner.worker${config.paths.framework.sourceExtension}`),
      ),
    )

    const pageGeneratorPath = FsLoc.encodeSync(
      FsLoc.join(
        config.paths.framework.sourceDir,
        FsLoc.fromString(`api/builder/ssg/page-generator.worker${config.paths.framework.sourceExtension}`),
      ),
    )

    yield* Ef.logDebug(`Creating worker pools with ${optimalWorkers} workers each`)

    // Create and use worker pools within a scoped context
    yield* Ef.scoped(
      Ef.gen(function*() {
        // Create the server pool with its spawner
        const serverPool = yield* Worker.makePoolSerialized<ServerMessage>({
          size: optimalWorkers,
        }).pipe(
          Ef.provide(Layer.mergeAll(
            createServerSpawner(serverRunnerPath),
            NodeWorker.layerManager,
          )),
        )

        // Create the page pool with its spawner
        const pagePool = yield* Worker.makePoolSerialized<PageMessage>({
          size: optimalWorkers,
          concurrency: 1, // One batch at a time per worker
        }).pipe(
          Ef.provide(Layer.mergeAll(
            createPageSpawner(pageGeneratorPath),
            NodeWorker.layerManager,
          )),
        )

        const serverPorts: number[] = []

        consola.info(`\nStarting SSG infrastructure:`)
        consola.info(`   Launching ${optimalWorkers} Polen app instances...`)
        yield* Ef.logDebug(`Finding available ports for servers`)

        // Get available ports
        for (let i = 0; i < optimalWorkers; i++) {
          const port = yield* Ef.tryPromise({
            try: () => getPort(),
            catch: (error) => new Error(`Failed to get port: ${error}`),
          })
          serverPorts.push(port)
        }
        yield* Ef.logDebug(`Using ports: ${serverPorts.join(', ')}`)

        // Start servers using Effect
        yield* Ef.all(
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
        yield* Ef.logDebug(`All servers started successfully`)

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

        // Process batches using Ef.all with timing
        const [elapsedTime, results] = yield* Ef.all(
          generateConfigs.map(({ batch, assignedPort, index }) =>
            pagePool
              .executeEffect(
                new GeneratePagesMessage({
                  routes: batch as readonly string[],
                  serverPort: assignedPort,
                  outputDir: FsLoc.encodeSync(config.paths.project.absolute.build.root),
                  ...(config.build.base ? { basePath: config.build.base } : {}),
                }),
              )
              .pipe(
                Ef.tap((result) =>
                  Ef.gen(function*() {
                    const completedBatches = yield* Ref.updateAndGet(completedBatchesRef, n => n + 1)
                    const totalPagesProcessed = yield* Ref.updateAndGet(totalPagesProcessedRef, n =>
                      n + result.processedCount)
                    // Still use process.stdout.write for progress bar - this is UI, not logging
                    const progress = Math.floor((completedBatches / batches.length) * 100)
                    yield* Ef.sync(() => {
                      process.stdout.write(
                        `\r   Progress: ${completedBatches}/${batches.length} batches (${progress}%) • ${totalPagesProcessed}/${totalRoutes} pages`,
                      )
                    })
                  })
                ),
                Ef.tapError((error) =>
                  Ef.logError(`Batch ${index} failed`).pipe(
                    Ef.annotateLogs({ error: String(error), batch }),
                  )
                ),
                Ef.map((result) => ({ ...result, batchIndex: index })),
                Ef.either, // Convert to Either to capture both success and failure
              )
          ),
          { concurrency: optimalWorkers },
        ).pipe(Ef.timed)

        // Partition results into successes and failures
        const [lefts, rights] = Ar.partition(results, Ei.isRight)
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
          const totalMemoryMB = Ar.reduce(successfulResults, 0, (sum, r) => sum + r.memoryUsed) / (1024 * 1024)
          const avgTimePerBatch = Ar.reduce(successfulResults, 0, (sum, r) => sum + r.duration)
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
            yield* Ef.fail(new Error(`SSG failed: ${totalFailures} pages could not be generated`))
          }
        } else {
          consola.error(`\n\nSSG Failed Completely`)
          consola.error(`   No pages were generated out of ${totalRoutes} total`)
          yield* Ef.fail(new Error(`SSG failed: No pages could be generated`))
        }

        yield* Ef.logDebug(`SSG generation complete`).pipe(
          Ef.annotateLogs({
            totalTime,
            successfulBatches: successfulResults.length,
          }),
        )
      }).pipe(
        // Provide NodeContext for Path service used in page generator
        Ef.provide(NodeContext.layer),
      ),
    ).pipe(
      // After scoped resources are released
      Ef.tap(() =>
        Ef.sync(() => {
          consola.info('\nShutting down...')
          consola.success('Cleanup complete.')
        })
      ),
      Ef.tap(() => Ef.logDebug(`All resources cleaned up`)),
    )
    // TODO: Properly type all error cases - can return ParseError | Error | WorkerError
    // FIXME: Remove cast when @effect/platform versions are aligned
  }) as any
