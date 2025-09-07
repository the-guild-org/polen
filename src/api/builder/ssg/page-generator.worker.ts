/**
 * Worker that generates static pages by fetching from servers.
 * This is executed in a worker thread using Effect Worker API.
 */
import { debugPolen } from '#singletons/debug'
import { Path, WorkerRunner } from '@effect/platform'
import { NodeContext, NodeRuntime, NodeWorkerRunner } from '@effect/platform-node'
import { Data, Effect, Layer } from 'effect'
import { promises as fs } from 'node:fs'
import { type GenerateResult, PageMessage } from './worker-messages.js'

const debug = debugPolen.sub(`api:ssg:page-generator`)

// ============================================================================
// Error Types
// ============================================================================

class RouteProcessingError extends Data.Error<{
  route: string
  cause: unknown
}> {
  override get message() {
    const causeMessage = this.cause instanceof Error
      ? this.cause.message
      : String(this.cause)
    return `Failed to process route ${this.route}: ${causeMessage}`
  }
}

// ============================================================================
// Generate Pages Handler
// ============================================================================

const handlers = {
  GeneratePages: (
    { routes, serverPort, outputDir }: { routes: readonly string[]; serverPort: number; outputDir: string },
  ) =>
    Effect.gen(function*() {
      const path = yield* Path.Path
      const startTime = Date.now()
      let processedCount = 0

      debug(`Starting batch generation`, {
        totalRoutes: routes.length,
        serverPort,
      })

      // Process each route by fetching from the server
      for (const route of routes) {
        yield* Effect.tryPromise({
          try: async () => {
            // Fetch the page from the server
            const url = `http://localhost:${serverPort}${route}`
            const response = await fetch(url)

            if (!response.ok) {
              throw new Error(`Failed to fetch ${route}: ${response.status} ${response.statusText}`)
            }

            const html = await response.text()

            // Determine output file path
            const outputPath = path.join(
              outputDir,
              route === '/' ? 'index.html' : `${route.slice(1)}/index.html`,
            )

            // Ensure directory exists
            const dir = path.dirname(outputPath)
            await fs.mkdir(dir, { recursive: true })

            // Write the HTML file
            await fs.writeFile(outputPath, html, 'utf-8')

            processedCount++

            // Log progress every 5 routes or on last route
            if (processedCount % 5 === 0 || processedCount === routes.length) {
              debug(`Progress`, {
                processedCount,
                totalRoutes: routes.length,
                serverPort,
              })
            }
          },
          catch: (error) => {
            debug(`Failed to process route`, { route, error })
            return new RouteProcessingError({ route, cause: error })
          },
        })
      }

      const result: GenerateResult = {
        success: true,
        processedCount,
        duration: Date.now() - startTime,
        memoryUsed: process.memoryUsage().heapUsed,
      }

      debug(`Batch generation complete`, result)
      return result
    }).pipe(
      Effect.catchAll((error) =>
        Effect.succeed({
          success: false,
          processedCount: 0,
          duration: Date.now() - Date.now(),
          memoryUsed: process.memoryUsage().heapUsed,
          error: error instanceof Error ? error.message : String(error),
        })
      ),
    ),
}

// ============================================================================
// Worker Runner
// ============================================================================

// Run the worker
WorkerRunner.launch(
  Layer.provide(
    WorkerRunner.layerSerialized(PageMessage, handlers),
    Layer.merge(NodeWorkerRunner.layer, NodeContext.layer),
  ),
).pipe(NodeRuntime.runMain)
