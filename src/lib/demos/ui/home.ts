/**
 * Main entry point for demo landing page generation
 */
import { type VersionHistory } from '#lib/version-history/index'
import { promises as fs } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { loadConfig } from '../config.ts'
import { transformCatalogToDeployments } from './catalog-transformer.ts'
import { DemosPage } from './components/DemosPage.tsx'
import { DemoDataCollector } from './data-collector.ts'
import { createDemoPageData, createDeploymentsData, transformDemoMetadata } from './data-transformer.ts'

// Define the interface for the build options
export interface Options {
  basePath?: string
  prNumber?: string
  currentSha?: string
  mode?: `production` | `development`
  prDeployments?: string | any[]
  outputDir?: string
  outputPath?: string
  // diff
  trunkDeployments?: string | any
  distTags?: string | Record<string, string>
}

// Options when using a version catalog
export interface CatalogOptions {
  basePath?: string
  prNumber?: string
  currentSha?: string
  mode?: `production` | `development`
  prDeployments?: string | any[]
  outputDir?: string
  outputPath?: string
  // diff
  catalog: VersionHistory.Catalog
}

/**
 * Build demos home page with a version catalog
 */
export async function buildDemosHomeWithCatalog(options: CatalogOptions): Promise<void> {
  const { catalog, ...otherOptions } = options
  const { trunkDeployments, distTags } = transformCatalogToDeployments(catalog)

  // Use the existing function with transformed data
  return buildHome({
    ...otherOptions,
    trunkDeployments,
    distTags,
  })
}

// Function overloads
export async function buildHome(options: CatalogOptions): Promise<void>
export async function buildHome(options?: Options): Promise<void>

/**
 * Main function that builds the demos home page
 */
export async function buildHome(options: CatalogOptions | Options = {}): Promise<void> {
  // Check if catalog is provided
  if (`catalog` in options && options.catalog) {
    return buildDemosHomeWithCatalog(options)
  }
  const config = {
    basePath: `/`,
    mode: `production` as const,
    outputDir: `dist-demos`,
    ...options,
  }

  // Load demo config
  const demoConfig = await loadConfig()

  // Collect all required data
  const dataCollector = new DemoDataCollector()
  const data = await dataCollector.collectLandingPageData(config)

  // Transform data using pure functions
  const demos = transformDemoMetadata(demoConfig, data.demoExamples, data.demoMetadata)
  const deployments = createDeploymentsData(config, data)
  const pageData = createDemoPageData(config, demoConfig, demos, deployments)

  // Render the page
  const html = `<!DOCTYPE html>\n${
    renderToString(
      React.createElement(DemosPage, { data: pageData }),
    )
  }`

  // Determine output path
  let outputPath: string

  if (config.outputPath) {
    // Use provided outputPath
    outputPath = config.outputPath

    // If it's a directory (no extension), append the filename
    if (!extname(outputPath)) {
      const fileName = `index.html`
      outputPath = join(outputPath, fileName)
    }

    // Ensure parent directory exists
    await fs.mkdir(dirname(outputPath), { recursive: true })
  } else {
    // Use outputDir (legacy behavior)
    await fs.mkdir(config.outputDir, { recursive: true })
    const fileName = `index.html`
    outputPath = join(config.outputDir, fileName)
  }

  await fs.writeFile(outputPath, html)
}
