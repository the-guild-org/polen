/**
 * Centralized deployment data fetching for demos
 * Provides a single source of truth for deployment information
 */

import type { GitHub } from '@actions/github/lib/utils.ts'
import { $ } from 'zx'

export interface Deployment {
  sha: string
  shortSha: string
  createdAt: string
  status?: 'success' | 'failure' | 'in_progress'
  url?: string
}

export interface PRDeployment {
  number: number
  sha?: string
  ref?: string
  previousDeployments: Deployment[]
}

/**
 * Fetch deployments for a specific PR using GitHub API
 */
export async function fetchPRDeployments(
  github: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  prNumber: string | number,
  currentSha?: string,
): Promise<Deployment[]> {
  const deployments: Deployment[] = []

  try {
    // Get all deployments for this PR's environment
    const { data: ghDeployments } = await github.rest.repos.listDeployments({
      owner,
      repo,
      environment: `pr-${prNumber}`,
      per_page: 100,
    })

    // Debug logging
    console.log(`Found ${ghDeployments.length} deployments for PR #${prNumber}`)

    // Process each deployment
    for (const deployment of ghDeployments) {
      console.log(
        `Processing deployment: ${deployment.id}, SHA: ${deployment.sha.substring(0, 7)}, Ref: ${deployment.ref}`,
      )

      // Get the latest status for this deployment
      const { data: statuses } = await github.rest.repos.listDeploymentStatuses({
        owner,
        repo,
        deployment_id: deployment.id,
        per_page: 1,
      })

      const latestStatus = statuses[0]
      const status = latestStatus?.state as Deployment['status']

      console.log(`  Status: ${status || 'no status'}`)

      // Only include successful deployments
      if (status === 'success') {
        const shortSha = deployment.sha.substring(0, 7)

        // Skip current SHA if provided
        // Check both full SHA and short SHA since deployments might use either
        if (currentSha) {
          const currentShortSha = currentSha.substring(0, 7)
          if (
            deployment.sha === currentSha
            || deployment.sha.startsWith(currentShortSha)
            || shortSha === currentShortSha
          ) {
            console.log(`  Skipping current SHA: ${shortSha}`)
            continue
          }
        }

        deployments.push({
          sha: deployment.sha,
          shortSha,
          createdAt: deployment.created_at,
          status,
          url: latestStatus?.environment_url,
        })
        console.log(`  Added to deployments list`)
      }
    }

    // Sort by creation date (newest first)
    deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`Returning ${deployments.length} successful deployments for PR #${prNumber}`)
  } catch (error) {
    console.error(`Error fetching deployments for PR #${prNumber}:`, error)
  }

  return deployments
}

/**
 * Fetch all PR deployments by scanning gh-pages branch
 * Used for the home page listing
 */
export async function fetchAllPRDeployments(): Promise<PRDeployment[]> {
  const prDeployments: PRDeployment[] = []

  try {
    // Fetch the gh-pages branch
    await $`git fetch origin gh-pages:refs/remotes/origin/gh-pages`.quiet()

    // List all directories in gh-pages branch
    const result = await $`git ls-tree -d --name-only origin/gh-pages`.quiet()
    const directories = result.stdout.trim().split('\n').filter(Boolean)

    // Filter for PR directories
    const prDirs = directories.filter(dir => dir.match(/^pr-\d+$/))

    for (const prDir of prDirs) {
      const prNumber = parseInt(prDir.replace('pr-', ''))

      // List SHA directories within this PR directory
      const shaResult = await $`git ls-tree -d --name-only origin/gh-pages:${prDir}`.quiet()
      const shaDirs = shaResult.stdout.trim().split('\n').filter(Boolean)

      const previousDeployments: Deployment[] = shaDirs.map(sha => ({
        sha,
        shortSha: sha.substring(0, 7),
        createdAt: '', // We don't have this info from git
        status: 'success' as const, // Assume success if directory exists
      }))

      prDeployments.push({
        number: prNumber,
        sha: shaDirs[0], // Latest deployment
        previousDeployments,
      })
    }

    // Sort by PR number (newest first)
    prDeployments.sort((a, b) => b.number - a.number)
  } catch (error) {
    console.error('Error fetching PR deployments from gh-pages:', error)
  }

  return prDeployments
}

/**
 * Fetch deployment metadata from a JSON file in gh-pages
 * This would be the ideal approach if we store metadata during deployment
 */
export async function fetchDeploymentMetadata(prNumber?: string | number): Promise<any> {
  try {
    const path = prNumber ? `pr-${prNumber}/deployments.json` : 'deployments.json'
    const result = await $`git show origin/gh-pages:${path}`.quiet()
    return JSON.parse(result.stdout)
  } catch (error) {
    // File doesn't exist yet
    return null
  }
}

/**
 * Create deployment metadata file content
 */
export function createDeploymentMetadata(
  deployments: Deployment[],
  currentDeployment?: {
    sha: string
    ref?: string
    timestamp: string
  },
): string {
  const metadata = {
    lastUpdated: new Date().toISOString(),
    current: currentDeployment,
    deployments: deployments.map(d => ({
      sha: d.sha,
      shortSha: d.shortSha,
      createdAt: d.createdAt,
      status: d.status,
      url: d.url,
    })),
  }

  return JSON.stringify(metadata, null, 2)
}
