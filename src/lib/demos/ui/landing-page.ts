/**
 * Main entry point for demo landing page generation
 */
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { DemoDataCollector } from './data-collector.ts'
import { DemoPageRenderer } from './page-renderer.ts'

// Define the interface for the build options
export interface BuildDemosHomeOptions {
  basePath?: string
  prNumber?: string
  currentSha?: string
  mode?: 'demo' | 'pr-index' | 'dev'
  prDeployments?: string | any[]
  trunkDeployments?: string | any
  distTags?: string | Record<string, string>
  serve?: boolean
  outputDir?: string
}

// Schema for validating options
const OptionsSchema = z.object({
  basePath: z.string().default('/'),
  prNumber: z.string().optional(),
  currentSha: z.string().optional(),
  mode: z.enum(['demo', 'pr-index', 'dev']).default('demo'),
  prDeployments: z.union([z.string(), z.any()]).optional(),
  trunkDeployments: z.union([z.string(), z.any()]).optional(),
  distTags: z.union([z.string(), z.record(z.string())]).optional(),
  serve: z.boolean().default(false),
  outputDir: z.string().default('dist-demos'),
})

/**
 * Main function that builds the demos home page
 */
export async function buildDemosHome(rawOptions: BuildDemosHomeOptions = {}): Promise<void> {
  // Validate and normalize options
  const options = OptionsSchema.parse(rawOptions)

  // Collect all required data
  const dataCollector = new DemoDataCollector()
  const data = await dataCollector.collectLandingPageData(options)

  // Render the page
  const renderer = new DemoPageRenderer()
  const html = renderer.renderPage(data)

  // Ensure output directory exists
  await fs.mkdir(options.outputDir, { recursive: true })

  // Write the appropriate file based on mode
  const fileName = options.mode === 'pr-index' ? 'pr-index.html' : 'index.html'
  const outputPath = join(options.outputDir, fileName)

  await fs.writeFile(outputPath, html)

  console.log(`✅ Built ${options.mode} page: ${outputPath}`)
}
