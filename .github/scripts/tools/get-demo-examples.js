#!/usr/bin/env node
// Helper script to get list of examples that should be included in demos
// Excludes examples with "demo": false in their package.json

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const examplesDir = path.join(__dirname, '..', 'examples')

const examples = []

// Read all directories in examples/
const dirs = fs.readdirSync(examplesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)

// Check each example's package.json
for (const dir of dirs) {
  const packageJsonPath = path.join(examplesDir, dir, 'package.json')

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    // Include by default, exclude if demo is explicitly false
    if (packageJson.demo !== false) {
      examples.push(dir)
    }
  } catch (e) {
    // If no package.json or error reading it, skip this directory
    console.error(`Warning: Could not read package.json for ${dir}:`, e.message)
  }
}

// Output space-separated list for use in bash
console.log(examples.join(' '))
