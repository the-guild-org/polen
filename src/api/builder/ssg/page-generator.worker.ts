/**
 * Worker that generates static pages by fetching from servers.
 * This is executed in a worker thread using Effect Worker API.
 */
import { Ar, Ei, S } from '#dep/effect'
import { Ef } from '#dep/effect'
import { FileSystem, WorkerRunner } from '@effect/platform'
import { NodeContext, NodeRuntime, NodeWorkerRunner } from '@effect/platform-node'
import { Fs, FsLoc } from '@wollybeard/kit'
import { Data, Duration, Layer } from 'effect'
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
  Ef.gen(function*() {
    const response = yield* Ef.tryPromise({
      try: () => fetch(url),
      catch: (error) => new Error(`Network error: ${error}`),
    })

    if (!response.ok) {
      return yield* Ef.fail(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
      )
    }

    return yield* Ef.tryPromise({
      try: () => response.text(),
      catch: (error) => new Error(`Failed to read response: ${error}`),
    })
  })

// Write HTML to file system
const writeHtmlFile = (outputPath: FsLoc.AbsFile, html: string) =>
  // Directories are automatically created when writing files
  Fs.write(outputPath, html)

// Process a single route
const processRoute = (
  route: string,
  serverPort: number,
  outputDir: FsLoc.AbsDir,
  basePath?: string,
) =>
  Ef.gen(function*() {
    // Fetch the page from the server
    // Construct URL with base path if provided
    const basePathNormalized = basePath ? basePath.replace(/\/$/, '') : ''
    const url = `http://localhost:${serverPort}${basePathNormalized}${route}`
    const html = yield* fetchPage(url).pipe(
      Ef.mapError(error => new RouteProcessingError({ route, cause: error })),
    )

    // Determine output file path
    const outputDirStr = S.encodeSync(FsLoc.AbsDir.String)(outputDir)
    const outputFileName = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`
    const outputPath = S.decodeSync(FsLoc.AbsFile.String)(
      `${outputDirStr}${outputDirStr.endsWith('/') ? '' : '/'}${outputFileName}`,
    )

    // Write the HTML file
    yield* writeHtmlFile(outputPath, html).pipe(
      Ef.mapError(error => new RouteProcessingError({ route, cause: error })),
    )

    return route
  })

const handlers = {
  GeneratePages: (
    { routes, serverPort, outputDir, basePath }: {
      routes: readonly string[]
      serverPort: number
      outputDir: string
      basePath?: string | undefined
    },
  ) =>
    Ef.gen(function*() {
      // Convert outputDir string to FsLoc.AbsDir
      const outputDirPath = S.decodeSync(FsLoc.AbsDir.String)(outputDir)

      yield* Ef.logDebug(`Starting batch generation`).pipe(
        Ef.annotateLogs({
          totalRoutes: routes.length,
          serverPort,
          basePath: basePath || 'none',
        }),
      )

      // Process all routes with timing, collecting both successes and failures
      const [duration, results] = yield* Ef.forEach(
        routes,
        (route, index) =>
          processRoute(route, serverPort, outputDirPath, basePath).pipe(
            Ef.tap(() =>
              // Log progress every 5 routes
              (index + 1) % 5 === 0 || index === routes.length - 1
                ? Ef.logDebug(`Progress: ${index + 1}/${routes.length} routes processed`)
                : Ef.void
            ),
            Ef.either, // Convert to Either to capture both success and failure
          ),
        { concurrency: 1 }, // Process sequentially to avoid overwhelming the server
      ).pipe(Ef.timed)

      // Partition results into successes and failures
      const [failures, successes] = Ar.partition(results, Ei.isRight)
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

      yield* Ef.logDebug(`Batch generation complete`).pipe(
        Ef.annotateLogs(result),
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
