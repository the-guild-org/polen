#!/usr/bin/env tsx
/**
 * Build script for the motif generator demo
 * Creates a standalone demo page with all dependencies bundled
 */

import { build } from 'esbuild'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function buildDemo() {
  console.log('Building Motif Generator demo...')

  const outDir = path.join(__dirname, 'dist')

  // Clean output directory
  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  // Build the browser-compatible library
  await build({
    entryPoints: [path.join(__dirname, '../browser.ts')],
    bundle: true,
    format: 'esm',
    outfile: path.join(outDir, 'motif-generator.ts'),
    platform: 'browser',
    sourcemap: true,
    minify: true,
    target: 'es2020',
  })

  // Copy and modify HTML
  const htmlContent = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8')
  const modifiedHtml = htmlContent.replace(
    "import { generateMotif } from '../browser.ts'",
    "import { generateMotif } from './motif-generator.ts'",
  )

  await fs.writeFile(path.join(outDir, 'index.html'), modifiedHtml)

  console.log(`✅ Demo built successfully!`)
  console.log(`📁 Output: ${outDir}`)
  console.log(`🌐 Open ${path.join(outDir, 'index.html')} in your browser`)
}

buildDemo().catch(console.error)
