#!/usr/bin/env node
/**
 * Get list of PR deployments from gh-pages
 * Used to build the PR index page
 */

import { execSync } from 'node:child_process'

try {
  // Fetch gh-pages to check existing PRs
  try {
    execSync('git fetch origin gh-pages:refs/remotes/origin/gh-pages', { stdio: 'ignore' })
  } catch (e) {
    // Ignore fetch errors - might not exist yet
  }

  // Get all PR directories from gh-pages
  let prDirs = []
  try {
    const output = execSync('git ls-tree -d --name-only origin/gh-pages', { encoding: 'utf8' })
    prDirs = output
      .split('\n')
      .filter(line => line.startsWith('pr-'))
      .sort((a, b) => {
        const aNum = parseInt(a.replace('pr-', ''))
        const bNum = parseInt(b.replace('pr-', ''))
        return aNum - bNum
      })
  } catch (e) {
    // No gh-pages branch yet
  }

  // Build PR deployments array
  const deployments = prDirs.map(dir => ({
    number: dir.replace('pr-', ''),
  }))

  console.log(JSON.stringify(deployments))
} catch (error) {
  console.error('Error:', error.message)
  console.log('[]') // Return empty array on error
}
