#!/usr/bin/env node
/**
 * Get trunk deployment information from gh-pages directory
 * Used by the update-demos-index action to build the demos landing page
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Get gh-pages path from command line or default
const ghPagesPath = process.argv[2] || path.join(__dirname, '..', 'gh-pages')

try {
  // Read all directories
  const entries = fs.readdirSync(ghPagesPath, { withFileTypes: true })

  // Filter to only semver directories
  const versions = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => /^[0-9]+\.[0-9]+\.[0-9]+/.test(name))
    .sort((a, b) => {
      // Simple version sort - put newer versions first
      const aParts = a.split(/[.-]/)
      const bParts = b.split(/[.-]/)

      for (let i = 0; i < 3; i++) {
        const aNum = parseInt(aParts[i] || '0')
        const bNum = parseInt(bParts[i] || '0')
        if (aNum !== bNum) return bNum - aNum
      }

      // If base versions are equal, stable comes before prerelease
      const aIsStable = !a.includes('-')
      const bIsStable = !b.includes('-')
      if (aIsStable && !bIsStable) return -1
      if (!aIsStable && bIsStable) return 1

      return 0
    })

  // Find latest stable version
  const latest = versions.find(v => !v.includes('-')) || null

  // Get previous versions (excluding latest)
  const previous = versions
    .filter(v => v !== latest)
    .slice(0, 10)

  // Output format expected by build-demos-index.ts
  const result = {
    latest: latest ? { sha: latest, shortSha: latest, tag: latest } : null,
    previous: previous.map(v => ({ sha: v, shortSha: v, tag: v })),
  }

  console.log(JSON.stringify(result))
} catch (error) {
  console.error('Error reading gh-pages directory:', error.message)
  process.exit(1)
}
