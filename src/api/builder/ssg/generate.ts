import type { Config } from '#api/config/index'
import { Routes } from '#api/routes/$'
import { chunk } from '#lib/kit-temp'
import { debugPolen } from '#singletons/debug'
import { NodeFileSystem } from '@effect/platform-node'
import { Path } from '@wollybeard/kit'
import consola from 'consola'
import { Effect } from 'effect'
import getPort from 'get-port'
import { cpus, totalmem } from 'node:os'
import workerpool from 'workerpool'
import type { GenerateConfig, GenerateResult } from './page-generator.worker.js'
import type { ServerConfig } from './server-runner.worker.js'

const debug = debugPolen.sub(`api:ssg:generate`)

export async function generate(config: Config.Config) {
  // Read routes from the manifest generated during build
  const manifest = await Effect.runPromise(
    Effect.provide(
      Routes.Manifest.get(config.paths.project.absolute.build.assets.root),
      NodeFileSystem.layer,
    ),
  )
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

  // Create server pool
  const serverPath = config.paths.project.absolute.build.serverEntrypoint
  const serverRunnerPath = Path.join(
    config.paths.framework.sourceDir,
    'api/builder/ssg/server-runner.worker' + config.paths.framework.sourceExtension,
  )

  const serverPool = workerpool.pool(serverRunnerPath, {
    minWorkers: 1,
    maxWorkers: optimalWorkers,
    workerType: 'process', // Use child processes for servers
    forkOpts: {
      // Enable Node.js experimental TypeScript support so workers can execute .ts files directly
      // --experimental-strip-types: Allows running TypeScript files without compilation
      // --disable-warning=ExperimentalWarning: Suppresses the experimental feature warning
      execArgv: ['--experimental-strip-types', '--disable-warning=ExperimentalWarning'],
    },
  })

  // Create page generator pool
  const pageGeneratorPath = Path.join(
    config.paths.framework.sourceDir,
    'api/builder/ssg/page-generator.worker' + config.paths.framework.sourceExtension,
  )

  const pagePool = workerpool.pool(pageGeneratorPath, {
    minWorkers: 1,
    maxWorkers: optimalWorkers,
    workerType: 'thread', // Use worker threads for page generation
    workerThreadOpts: {
      // Enable Node.js experimental TypeScript support so workers can execute .ts files directly
      // --experimental-strip-types: Allows running TypeScript files without compilation
      // --disable-warning=ExperimentalWarning: Suppresses the experimental feature warning
      execArgv: ['--experimental-strip-types', '--disable-warning=ExperimentalWarning'],
    },
  })

  const serverPorts: number[] = []

  try {
    consola.info(`\nStarting SSG infrastructure:`)
    consola.info(`   Launching ${optimalWorkers} Polen app instances...`)
    debug(`Finding available ports for servers`)

    // Get available ports
    for (let i = 0; i < optimalWorkers; i++) {
      const port = await getPort()
      serverPorts.push(port)
    }
    debug(`Using ports:`, serverPorts)

    // Start servers
    const serverPromises: Promise<void>[] = []
    for (const port of serverPorts) {
      const config: ServerConfig = {
        serverPath,
        port,
      }

      serverPromises.push(
        serverPool.exec('startServer', [config]),
      )
    }

    // Wait for all servers to be ready
    await Promise.all(serverPromises)
    consola.success(`   All ${optimalWorkers} app instances ready on ports: ${serverPorts.join(', ')}`)
    debug(`All servers started successfully`)

    // Prepare page generation configs
    // Each batch is assigned to a server in round-robin fashion
    const generateConfigs: GenerateConfig[] = batches.map((batch, index) => {
      const assignedPort = serverPorts[index % serverPorts.length]!
      debug(`Batch ${index + 1}: ${batch.length} routes → server on port ${assignedPort}`)
      return {
        routes: batch,
        serverPort: assignedPort,
        outputDir: config.paths.project.absolute.build.root,
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

    // Track worker progress
    const workerProgress = new Map<number, { processed: number; total: number }>()

    const pagePromises = generateConfigs.map(async (config, batchIndex) => {
      try {
        const result: GenerateResult = await pagePool.exec('generatePages', [config], {
          on: (payload: any) => {
            if (payload.type === 'batch_start') {
              debug(
                `Worker started batch ${
                  batchIndex + 1
                }: ${payload.totalRoutes} routes on server port ${payload.serverPort}`,
              )
            } else if (payload.type === 'progress') {
              workerProgress.set(batchIndex, {
                processed: payload.processedCount,
                total: payload.totalRoutes,
              })

              // Log detailed worker progress in debug mode
              const workerStats = Array.from(workerProgress.entries())
                .map(([idx, stats]) => `Batch ${idx + 1}: ${stats.processed}/${stats.total}`)
                .join(' | ')
              debug(`Worker progress: ${workerStats}`)
            }
          },
        })

        if (!result.success) {
          throw new Error(result.error || 'Page generation failed')
        }

        // Update progress after each batch completes
        completedBatches++
        totalPagesProcessed += result.processedCount

        const elapsed = (Date.now() - startTime) / 1000
        const pagesPerSec = elapsed > 0 ? (totalPagesProcessed / elapsed).toFixed(1) : '0'
        const progress = Math.floor((completedBatches / batches.length) * 100)

        process.stdout.write(
          `\r   Progress: ${completedBatches}/${batches.length} batches (${progress}%) • ${totalPagesProcessed}/${totalRoutes} pages • ${pagesPerSec} pages/s`,
        )

        return result
      } catch (error) {
        consola.error(`\nBatch ${batchIndex} failed:`, error)
        debug(`Batch ${batchIndex} error details`, { error, config })
        throw error
      }
    })

    const results = await Promise.allSettled(pagePromises)

    // Filter successful results and handle failures
    const successfulResults: GenerateResult[] = []
    const failures: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value)
      } else {
        failures.push(`Batch ${index}: ${result.reason}`)
      }
    })

    if (failures.length > 0) {
      consola.error(`\n${failures.length} batches failed:`)
      failures.forEach(failure => consola.error(`   ${failure}`))
      throw new Error(`SSG generation failed for ${failures.length} batches`)
    }

    // Final stats using successful results
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    const totalMemoryMB = successfulResults.reduce((sum, r) => sum + r.memoryUsed, 0) / (1024 * 1024)
    const avgTimePerBatch = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length / 1000

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
  } finally {
    consola.info('\nShutting down...')
    debug(`Beginning cleanup`)

    // Terminate all workers and pools
    // workerpool will handle cleanup of child processes
    await Promise.all([
      serverPool.terminate(),
      pagePool.terminate(),
    ])

    consola.success('Cleanup complete.')
    debug(`All resources cleaned up`)
  }
}
