#!/usr/bin/env node
// Helper script to get list of examples that should be included in demos
// Excludes examples listed in .github/demo-config.json

import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDemoConfig } from '../../../src/lib/demos/config.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function getDemoExamples(): Promise<string[]> {
  const examplesDir = path.join(__dirname, '..', '..', '..', 'examples')
  const config = getDemoConfig()

  const examples: string[] = []

  // Read all directories in examples/
  try {
    const dirs = await fs.readdir(examplesDir, { withFileTypes: true })
    const dirNames = dirs
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    examples.push(...dirNames)
  } catch (e) {
    console.error(`Error reading examples directory:`, (e as Error).message)
  }

  // Use DemoConfig to filter and order examples
  return config.getOrderedDemos(examples)
}

// If run directly as CLI, output space-separated list
if (import.meta.url === `file://${process.argv[1]}`) {
  const examples = await getDemoExamples()
  console.log(examples.join(' '))
}
