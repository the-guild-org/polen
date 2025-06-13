#!/usr/bin/env node
/**
 * Get dist-tag information from gh-pages directory
 * Returns which semver versions the dist-tags point to
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Get gh-pages path from command line or default
const ghPagesPath = process.argv[2] || path.join(__dirname, '..', 'gh-pages')

try {
  const distTags = {}

  // Check each dist-tag directory to see what it contains
  const distTagNames = ['latest', 'next']

  for (const tag of distTagNames) {
    const tagPath = path.join(ghPagesPath, tag)

    if (fs.existsSync(tagPath)) {
      // Look for a file that indicates which version this is
      // We'll check one of the example directories for a file that has the base path
      const exampleDirs = fs.readdirSync(tagPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)

      // Try to find the original semver version from the content
      let detectedVersion = null

      for (const example of exampleDirs) {
        const indexPath = path.join(tagPath, example, 'index.html')
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, 'utf-8')
          // Look for any semver version in paths that might have been missed by find-replace
          const versionMatch = content.match(/\/polen\/([0-9]+\.[0-9]+\.[0-9]+(?:-[^\/]+)?)\//i)
          if (versionMatch) {
            detectedVersion = versionMatch[1]
            break
          }
        }
      }

      // If we couldn't detect from content, check if there's a matching semver directory
      // This assumes dist-tags are updated after semver deployments
      if (!detectedVersion) {
        const versions = fs.readdirSync(ghPagesPath, { withFileTypes: true })
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name)
          .filter(name => /^[0-9]+\.[0-9]+\.[0-9]+/.test(name))

        // For latest, find the newest stable version
        // For next, find the newest prerelease
        if (tag === 'latest') {
          detectedVersion = versions
            .filter(v => !v.includes('-'))
            .sort((a, b) => {
              const aParts = a.split('.')
              const bParts = b.split('.')
              for (let i = 0; i < 3; i++) {
                const aNum = parseInt(aParts[i] || '0')
                const bNum = parseInt(bParts[i] || '0')
                if (aNum !== bNum) return bNum - aNum
              }
              return 0
            })[0]
        } else if (tag === 'next') {
          detectedVersion = versions
            .filter(v => v.includes('-'))
            .sort((a, b) => {
              const aParts = a.split(/[.-]/)
              const bParts = b.split(/[.-]/)
              for (let i = 0; i < 3; i++) {
                const aNum = parseInt(aParts[i] || '0')
                const bNum = parseInt(bParts[i] || '0')
                if (aNum !== bNum) return bNum - aNum
              }
              return 0
            })[0]
        }
      }

      if (detectedVersion) {
        distTags[tag] = detectedVersion
      }
    }
  }

  console.log(JSON.stringify(distTags))
} catch (error) {
  console.error('Error reading dist-tags:', error.message)
  console.log('{}')
}
