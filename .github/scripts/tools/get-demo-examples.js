#!/usr/bin/env node
// Helper script to get list of examples that should be included in demos
// Excludes examples listed in .github/demo-config.json

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default function getDemoExamples() {
  const examplesDir = path.join(__dirname, '..', '..', '..', 'examples')
  const configPath = path.join(__dirname, '..', '..', 'demo-config.json')

  // Read demo config from main branch
  let excludedDemos = []
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    excludedDemos = config.excludeDemos || []
  } catch (e) {
    console.error('Warning: Could not read demo-config.json, including all examples')
  }

  const examples = []

  // Read all directories in examples/
  try {
    const dirs = fs.readdirSync(examplesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    // Include all examples except those explicitly excluded
    for (const dir of dirs) {
      if (!excludedDemos.includes(dir)) {
        examples.push(dir)
      }
    }
  } catch (e) {
    console.error(`Error reading examples directory:`, e.message)
  }

  return examples
}

// If run directly as CLI, output space-separated list
if (import.meta.url === `file://${process.argv[1]}`) {
  const examples = getDemoExamples()
  console.log(examples.join(' '))
}
