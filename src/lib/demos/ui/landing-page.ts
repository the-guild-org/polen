/**
 * Main entry point for demo landing page generation
 */
import type { VersionCatalog } from '#lib/version-history/index'
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

// Options when using a version catalog
export interface CatalogOptions {
  basePath?: string
  prNumber?: string
  currentSha?: string
  mode?: 'production' | 'development'
  prDeployments?: string | any[]
  catalog: VersionCatalog
  outputDir?: string
  outputPath?: string
}

/**
 * Build demos home page with a version catalog
 */
export async function buildDemosHomeWithCatalog(options: CatalogOptions): Promise<void> {
  const { catalog, ...otherOptions } = options

  // Transform catalog data inline
  const latestStable = catalog.distTags.latest || catalog.stable[0] || null
  const trunkDeployments = {
    latest: latestStable
      ? {
        sha: latestStable.git.sha,
        shortSha: latestStable.git.sha.substring(0, 7),
        tag: latestStable.git.tag,
      }
      : null,
    previous: catalog.versions
      .filter(v => v.git.tag !== latestStable?.git.tag)
      .slice(0, 10)
      .map(v => ({
        sha: v.git.sha,
        shortSha: v.git.sha.substring(0, 7),
        tag: v.git.tag,
      })),
  }

  const distTags: Record<string, string> = {}
  for (const [name, version] of Object.entries(catalog.distTags)) {
    if (version) {
      distTags[name] = version.git.tag
    }
  }

  // Use the existing function with transformed data
  return buildDemosHome({
    ...otherOptions,
    trunkDeployments,
    distTags,
  })
}

// Function overloads
export async function buildDemosHome(options: CatalogOptions): Promise<void>
export async function buildDemosHome(options?: Options): Promise<void>

/**
 * Main function that builds the demos home page
 */
export async function buildDemosHome(options: CatalogOptions | Options = {}): Promise<void> {
  // Check if catalog is provided
  if ('catalog' in options && options.catalog) {
    return buildDemosHomeWithCatalog(options as CatalogOptions)
  }
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
