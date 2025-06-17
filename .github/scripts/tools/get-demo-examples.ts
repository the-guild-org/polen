#!/usr/bin/env node
// Helper script to get list of examples that should be included in demos
// Excludes examples listed in .github/demo-config.json

import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function getDemoExamples(): Promise<string[]> {
  const examplesDir = path.join(__dirname, '..', '..', '..', 'examples')
  const configPath = path.join(__dirname, '..', '..', 'demo-config.json')

  // Read demo config from main branch
  let excludedDemos: string[] = []
  let demoOrder: string[] = []
  try {
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'))
    excludedDemos = config.excludeDemos || []
    demoOrder = config.order || []
  } catch (e) {
    console.error('Warning: Could not read demo-config.json, including all examples')
  }

  const examples: string[] = []

  // Read all directories in examples/
  try {
    const dirs = await fs.readdir(examplesDir, { withFileTypes: true })
    const dirNames = dirs
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    // Include all examples except those explicitly excluded
    for (const dir of dirNames) {
      if (!excludedDemos.includes(dir)) {
        examples.push(dir)
      }
    }
  } catch (e) {
    console.error(`Error reading examples directory:`, (e as Error).message)
  }

  // Sort examples according to the order specified in demo-config.json
  // Examples in the order array come first in the specified order,
  // followed by any remaining examples in alphabetical order
  const orderedExamples: string[] = []
  const remainingExamples = [...examples]

  // Add examples in the specified order
  for (const demo of demoOrder) {
    if (examples.includes(demo)) {
      orderedExamples.push(demo)
      const index = remainingExamples.indexOf(demo)
      if (index > -1) {
        remainingExamples.splice(index, 1)
      }
    }
  }

  // Add remaining examples in alphabetical order
  remainingExamples.sort()
  orderedExamples.push(...remainingExamples)

  return orderedExamples
}

// If run directly as CLI, output space-separated list
if (import.meta.url === `file://${process.argv[1]}`) {
  const examples = await getDemoExamples()
  console.log(examples.join(' '))
}
