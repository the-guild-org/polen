/**
 * Main entry point for demo landing page generation
 */
import { promises as fs } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { DemoDataCollector } from './data-collector.ts'
import { DemoPageRenderer } from './page-renderer.ts'

// Define the interface for the build options
export interface Options {
  basePath?: string
  prNumber?: string
  currentSha?: string
  mode?: 'production' | 'development'
  prDeployments?: string | any[]
  trunkDeployments?: string | any
  distTags?: string | Record<string, string>
  outputDir?: string
  outputPath?: string
}

/**
 * Main function that builds the demos home page
 */
export async function buildDemosHome(options: Options = {}): Promise<void> {
  const config = {
    basePath: '/',
    mode: 'production' as const,
    outputDir: 'dist-demos',
    ...options,
  }

  // Collect all required data
  const dataCollector = new DemoDataCollector()
  const data = await dataCollector.collectLandingPageData(config)

  // Render the page
  const renderer = new DemoPageRenderer()
  const html = renderer.renderPage(data)

  // Determine output path
  let outputPath: string

  if (config.outputPath) {
    // Use provided outputPath
    outputPath = config.outputPath

    // If it's a directory (no extension), append the filename
    if (!extname(outputPath)) {
      const fileName = 'index.html'
      outputPath = join(outputPath, fileName)
    }

    // Ensure parent directory exists
    await fs.mkdir(dirname(outputPath), { recursive: true })
  } else {
    // Use outputDir (legacy behavior)
    await fs.mkdir(config.outputDir, { recursive: true })
    const fileName = 'index.html'
    outputPath = join(config.outputDir, fileName)
  }

  await fs.writeFile(outputPath, html)

  console.log(`✅ Built ${config.mode === 'development' ? 'dev' : config.mode} page: ${outputPath}`)
}
