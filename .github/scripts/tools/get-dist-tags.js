#!/usr/bin/env node
/**
 * Get dist-tag information from git tags
 * Returns which semver versions the dist-tags point to
 */

import { execSync } from 'node:child_process'

try {
  const distTags = {}
  const distTagNames = ['latest', 'next']

  for (const tag of distTagNames) {
    try {
      // Get the commit that this dist-tag points to
      const tagCommit = execSync(`git rev-list -n 1 ${tag}`, { encoding: 'utf-8' }).trim()

      // Find all tags at this commit
      const tagsAtCommit = execSync(`git tag --points-at ${tagCommit}`, { encoding: 'utf-8' })
        .split('\n')
        .filter(t => t.trim())

      // Find the semver tag
      const semverTag = tagsAtCommit.find(t => /^[0-9]+\.[0-9]+\.[0-9]+/.test(t))

      if (semverTag) {
        distTags[tag] = semverTag
      }
    } catch (e) {
      // Tag doesn't exist or other error - silently continue
    }
  }

  console.log(JSON.stringify(distTags))
} catch (error) {
  console.error('Error reading dist-tags:', error.message)
  console.log('{}')
}
