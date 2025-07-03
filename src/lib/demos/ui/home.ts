/**
 * Main entry point for demo landing page generation
 */
import type { VersionHistory } from '#lib/version-history/index'
import { promises as fs } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { loadConfig } from '../config.ts'
import { transformCatalogToDeployments } from './catalog-transformer.ts'
import { DemosPage } from './components/DemosPage.tsx'
import { DemoDataCollector } from './data-collector.ts'
import { createDemoPageData, createDeploymentsData, transformDemoMetadata } from './data-transformer.ts'
import type { BuildConfig } from './types.ts'

export type { BuildConfig } from './types.ts'

/**
 * Main function that builds the demos home page
 */
export async function buildHome(config: BuildConfig): Promise<void> {
  // Create deployments based on mode
  let deployments
  if (config.mode === 'trunk') {
    const deploymentData = transformCatalogToDeployments(config.catalog)
    deployments = createDeploymentsData({}, deploymentData)
  } else {
    // Preview mode - pre-process PR deployments
    const currentPr = config.prDeployments.find(
      pr => pr.number.toString() === config.prNumber,
    )
    deployments = {
      type: 'pr' as const,
      prNumber: config.prNumber,
      currentSha: config.currentSha,
      previousVersions: currentPr?.previousDeployments
        ?.filter(sha => sha !== config.currentSha)
        ?.map(sha => ({ sha, shortSha: sha.substring(0, 7) })) || [],
    }
  }

  // Load demo config
  const demoConfig = await loadConfig()

  // Collect all required data
  const dataCollector = new DemoDataCollector()
  const data = await dataCollector.collectLandingPageData({
    basePath: config.basePath || '/',
    mode: 'production',
    prNumber: config.mode === 'preview' ? config.prNumber : undefined,
    currentSha: config.mode === 'preview' ? config.currentSha : undefined,
  })

  // Transform data using pure functions
  const demos = transformDemoMetadata(demoConfig, data.demoExamples, data.demoMetadata)

  const pageData = createDemoPageData(
    {
      basePath: config.basePath || '/',
      prNumber: config.mode === 'preview' ? config.prNumber : undefined,
      currentSha: config.mode === 'preview' ? config.currentSha : undefined,
    },
    demoConfig,
    demos,
    deployments,
  )

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
    const outputDir = config.outputDir || 'dist-demos'
    await fs.mkdir(outputDir, { recursive: true })
    const fileName = `index.html`
    outputPath = join(outputDir, fileName)
  }

  await fs.writeFile(outputPath, html)
}
