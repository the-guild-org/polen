/**
 * Worker pool task that generates static pages by fetching from servers.
 * This is executed in a worker thread or child process by workerpool.
 */
import { debugPolen } from '#singletons/debug'
import { Path } from '@wollybeard/kit'
import { promises as fs } from 'node:fs'

const debug = debugPolen.sub(`api:ssg:page-generator`)

export interface GenerateConfig {
  routes: string[]
  serverPort: number
  outputDir: string
}

export interface GenerateResult {
  success: boolean
  processedCount: number
  duration: number
  memoryUsed: number
  error?: string
}

/**
 * Generate static HTML files for the given routes.
 */
export async function generatePages(config: GenerateConfig): Promise<GenerateResult> {
  const startTime = Date.now()
  let processedCount = 0

  try {
    const { routes, serverPort, outputDir } = config

    // Emit initial status
    workerpool.workerEmit({
      type: 'batch_start',
      totalRoutes: routes.length,
      serverPort,
    })

    // Process each route by fetching from the server
    for (const route of routes) {
      try {
        // Fetch the page from the server
        const url = `http://localhost:${serverPort}${route}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch ${route}: ${response.status} ${response.statusText}`)
        }

        const html = await response.text()

        // Determine output file path
        const outputPath = Path.join(
          outputDir,
          route === '/' ? 'index.html' : `${route.slice(1)}/index.html`,
        )

        // Ensure directory exists
        const dir = Path.dirname(outputPath)
        await fs.mkdir(dir, { recursive: true })

        // Write the HTML file
        await fs.writeFile(outputPath, html, 'utf-8')

        processedCount++

        // Emit progress every 5 routes or on last route
        if (processedCount % 5 === 0 || processedCount === routes.length) {
          workerpool.workerEmit({
            type: 'progress',
            processedCount,
            totalRoutes: routes.length,
            serverPort,
          })
        }
      } catch (error) {
        debug(`Failed to process route`, { route, error })
        throw error
      }
    }

    return {
      success: true,
      processedCount,
      duration: Date.now() - startTime,
      memoryUsed: process.memoryUsage().heapUsed,
    }
  } catch (error) {
    debug(`Page generation error`, { error, processedCount })
    return {
      success: false,
      processedCount,
      duration: Date.now() - startTime,
      memoryUsed: process.memoryUsage().heapUsed,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Register with workerpool for ESM
import workerpool from 'workerpool'

workerpool.worker({
  generatePages,
})
