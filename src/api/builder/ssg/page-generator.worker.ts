/**
 * Worker that generates static pages by fetching from servers.
 * This is executed in a worker thread using Effect Worker API.
 */
import { FileSystem, Path, WorkerRunner } from '@effect/platform'
import { NodeContext, NodeRuntime, NodeWorkerRunner } from '@effect/platform-node'
import { Array, Data, Duration, Effect, Either, Layer } from 'effect'
import { type GenerateResult, PageMessage } from './worker-messages.js'

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

// Fetch HTML from server using Effect patterns
const fetchPage = (url: string) =>
  Effect.gen(function*() {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) => new Error(`Network error: ${error}`),
    })

    if (!response.ok) {
      return yield* Effect.fail(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
      )
    }

    return yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (error) => new Error(`Failed to read response: ${error}`),
    })
  })

// Write HTML to file system
const writeHtmlFile = (outputPath: string, html: string) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const dir = path.dirname(outputPath)
    yield* fs.makeDirectory(dir, { recursive: true })
    yield* fs.writeFileString(outputPath, html)
  })

// Process a single route
const processRoute = (
  route: string,
  serverPort: number,
  outputDir: string,
) =>
  Effect.gen(function*() {
    const path = yield* Path.Path

    // Fetch the page from the server
    const url = `http://localhost:${serverPort}${route}`
    const html = yield* fetchPage(url).pipe(
      Effect.mapError(error => new RouteProcessingError({ route, cause: error })),
    )

    // Determine output file path
    const outputPath = path.join(
      outputDir,
      route === '/' ? 'index.html' : `${route.slice(1)}/index.html`,
    )

    // Write the HTML file
    yield* writeHtmlFile(outputPath, html).pipe(
      Effect.mapError(error => new RouteProcessingError({ route, cause: error })),
    )

    return route
  })

const handlers = {
  GeneratePages: (
    { routes, serverPort, outputDir }: { routes: readonly string[]; serverPort: number; outputDir: string },
  ) =>
    Effect.gen(function*() {
      yield* Effect.logDebug(`Starting batch generation`).pipe(
        Effect.annotateLogs({
          totalRoutes: routes.length,
          serverPort,
        }),
      )

      // Process all routes with timing, collecting both successes and failures
      const [duration, results] = yield* Effect.forEach(
        routes,
        (route, index) =>
          processRoute(route, serverPort, outputDir).pipe(
            Effect.tap(() =>
              // Log progress every 5 routes
              (index + 1) % 5 === 0 || index === routes.length - 1
                ? Effect.logDebug(`Progress: ${index + 1}/${routes.length} routes processed`)
                : Effect.void
            ),
            Effect.either, // Convert to Either to capture both success and failure
          ),
        { concurrency: 1 }, // Process sequentially to avoid overwhelming the server
      ).pipe(Effect.timed)

      // Partition results into successes and failures
      const [failures, successes] = Array.partition(results, Either.isRight)
      const processedCount = successes.length

      const result: GenerateResult = {
        success: failures.length === 0,
        processedCount,
        duration: Duration.toMillis(duration),
        memoryUsed: process.memoryUsage().heapUsed,
        ...(failures.length > 0 && {
          error: `Failed to generate ${failures.length} out of ${routes.length} routes`,
          failures: failures.map((f) => ({
            route: f.left.route,
            error: f.left.cause instanceof Error ? f.left.cause.message : String(f.left.cause),
          })),
        }),
      }

      yield* Effect.logDebug(`Batch generation complete`).pipe(
        Effect.annotateLogs(result),
      )

      return result
    }),
}

// ============================================================================
// Worker Runner
// ============================================================================

// Run the worker
WorkerRunner.launch(
  Layer.provide(
    WorkerRunner.layerSerialized(PageMessage, handlers),
    Layer.mergeAll(
      NodeWorkerRunner.layer,
      NodeContext.layer,
    ),
  ),
).pipe(NodeRuntime.runMain)
