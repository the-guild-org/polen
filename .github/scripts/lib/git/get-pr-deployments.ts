import { $ } from 'zx'

interface PRDeployment {
  number: string
  url?: string
  createdAt?: string
  sha?: string
}

/**
 * Get list of PR deployments using GitHub Deployments API
 */
export async function getPRDeployments(): Promise<PRDeployment[]> {
  // Configure zx
  $.verbose = false

  try {
    // Get deployments from GitHub API
    const deployments =
      await $`gh api repos/:owner/:repo/deployments --jq '[.[] | select(.environment == "github-pages" and (.payload.pr_number // .ref | test("^refs/pull/[0-9]+")))] | sort_by(.created_at) | reverse'`
    const deploymentData = JSON.parse(deployments.stdout)

    // Extract PR numbers from deployments
    const prMap = new Map<string, PRDeployment>()

    for (const deployment of deploymentData) {
      let prNumber: string | null = null

      // Check payload for PR number
      if (deployment.payload?.pr_number) {
        prNumber = String(deployment.payload.pr_number)
      } else if (deployment.ref?.startsWith('refs/pull/')) {
        // Extract from ref like "refs/pull/123/merge"
        const match = deployment.ref.match(/refs\/pull\/(\d+)/)
        if (match) {
          prNumber = match[1]
        }
      }

      if (prNumber && !prMap.has(prNumber)) {
        prMap.set(prNumber, {
          number: prNumber,
          url: deployment.payload?.web_url,
          createdAt: deployment.created_at,
          sha: deployment.sha?.substring(0, 7),
        })
      }
    }

    // Return sorted by PR number
    return Array.from(prMap.values()).sort((a, b) => parseInt(a.number) - parseInt(b.number))
  } catch (e) {
    // Return empty array if GitHub API is not available
    console.error('Failed to get PR deployments from GitHub API:', e)
    return []
  }
}
