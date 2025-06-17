#!/usr/bin/env node
/**
 * Main entry point for demo landing page generation
 * Replaces the original scripts/build-demos-home.ts with a modular approach
 */

import { Command } from '@molt/command'
import { promises as fs } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { z } from 'zod'
import { DemoDataCollector } from './data-collector.ts'
import { DemoPageRenderer } from './page-renderer.ts'
import { WorkflowError, safeExecute } from '../../shared/error-handling.ts'

// Define the interface for the build options
export interface BuildDemosHomeOptions {
  basePath?: string
  prNumber?: string
  currentSha?: string
  mode?: 'demo' | 'pr-index' | 'dev'
  prDeployments?: string
  trunkDeployments?: string
  distTags?: string
  serve?: boolean
  outputDir?: string
}

// Schema for validating options
const OptionsSchema = z.object({
  basePath: z.string().default('/'),
  prNumber: z.string().optional(),
  currentSha: z.string().optional(),
  mode: z.enum(['demo', 'pr-index', 'dev']).default('demo'),
  prDeployments: z.string().optional(),
  trunkDeployments: z.string().optional(),
  distTags: z.string().optional(),
  serve: z.boolean().default(false),
  outputDir: z.string().default('dist-demos'),
})

/**
 * Main function that builds the demos home page
 */
export async function buildDemosHome(rawOptions: BuildDemosHomeOptions = {}): Promise<void> {
  return safeExecute('build-demos-home', async () => {
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
    
    // Start development server if requested
    if (options.serve) {
      await startDevServer(outputPath, html)
    }
  })
}

/**
 * Start development server for testing
 */
async function startDevServer(filePath: string, html: string): Promise<void> {
  const server = createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    })
    res.end(html)
  })

  const port = 3000
  server.listen(port, () => {
    console.log(`🚀 Development server running at http://localhost:${port}`)
    console.log('Press Ctrl+C to stop')
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n👋 Shutting down development server...')
    server.close(() => {
      process.exit(0)
    })
  })
}

/**
 * CLI entry point (when run directly)
 */
async function main() {
  const command = Command.create()
    .parameter('basePath', z.string().optional().describe('Base path for demo links'))
    .parameter('prNumber', z.string().optional().describe('PR number for preview mode'))
    .parameter('currentSha', z.string().optional().describe('Current commit SHA'))
    .parameter('mode', z.enum(['demo', 'pr-index', 'dev']).optional().describe('Page mode'))
    .parameter('prDeployments', z.string().optional().describe('JSON string of PR deployments'))
    .parameter('trunkDeployments', z.string().optional().describe('JSON string of trunk deployments'))
    .parameter('distTags', z.string().optional().describe('JSON string of dist-tags'))
    .parameter('serve', z.boolean().optional().describe('Start development server'))
    .parameter('outputDir', z.string().optional().describe('Output directory'))

  try {
    const args = await command.parse()
    await buildDemosHome(args)
  } catch (error) {
    if (error instanceof WorkflowError) {
      console.error(`❌ ${error.message}`)
      if (error.cause) {
        console.error('Caused by:', error.cause)
      }
    } else {
      console.error('❌ Unexpected error:', error)
    }
    process.exit(1)
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}