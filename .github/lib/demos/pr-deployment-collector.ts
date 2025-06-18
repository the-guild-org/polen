/**
 * Collects previous PR deployments from gh-pages branch
 */

import { execSync } from 'node:child_process'

/**
 * Get previous deployments for a PR by checking gh-pages branch
 */
export function getPreviousDeployments(prNumber: string, currentSha?: string): string[] {
  try {
    // Fetch gh-pages branch
    execSync('git fetch origin gh-pages:refs/remotes/origin/gh-pages', { stdio: 'ignore' })

    // Get list of commit directories
    const prDir = `pr-${prNumber}`
    const result = execSync(`git ls-tree -d --name-only "origin/gh-pages:${prDir}" 2>/dev/null || echo ""`, {
      encoding: 'utf-8',
    })

    const commits = result
      .split('\n')
      .filter(line => line && /^[0-9a-f]{7,40}$/.test(line))
      .filter(sha => sha !== currentSha) // Exclude current deployment
      .sort()
      .reverse()

    return commits
  } catch (e) {
    console.warn(`Failed to get previous deployments for PR ${prNumber}:`, e)
    return []
  }
}

/**
 * Get all PR deployments from gh-pages branch
 */
export function getAllPrDeployments(): { number: number; sha?: string; ref?: string }[] {
  try {
    // Fetch gh-pages branch
    execSync('git fetch origin gh-pages:refs/remotes/origin/gh-pages', { stdio: 'ignore' })

    // Get list of pr- directories
    const result = execSync(`git ls-tree -d --name-only "origin/gh-pages" | grep "^pr-" || echo ""`, {
      encoding: 'utf-8',
    })

    const prDirs = result
      .split('\n')
      .filter(line => line && line.startsWith('pr-'))
      .map(dir => {
        const match = dir.match(/^pr-(\d+)$/)
        if (!match) return null

        const prNumber = parseInt(match[1]!, 10)

        // Get latest SHA for this PR
        try {
          const shas = execSync(
            `git ls-tree -d --name-only "origin/gh-pages:${dir}" 2>/dev/null | grep "^[0-9a-f]" | head -1 || echo ""`,
            { encoding: 'utf-8' },
          ).trim()

          return {
            number: prNumber,
            sha: shas || undefined,
          }
        } catch {
          return { number: prNumber }
        }
      })
      .filter((pr): pr is { number: number; sha?: string } => pr !== null)
      .sort((a, b) => b.number - a.number) // Sort newest first

    return prDirs
  } catch (e) {
    console.warn('Failed to get all PR deployments:', e)
    return []
  }
}
