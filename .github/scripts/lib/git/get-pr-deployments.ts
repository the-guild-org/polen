import { $ } from 'zx'

interface PRDeployment {
  number: string
  url?: string
  createdAt?: string
  sha?: string
}

/**
 * Get list of PR deployments using GitHub Deployments API
 * Falls back to checking gh-pages branch if API is not available
 */
export async function getPRDeployments(): Promise<PRDeployment[]> {
  // Configure zx
  $.verbose = false

  // Try using GitHub CLI to get deployments
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
    // Fall back to git method if GitHub CLI is not available or fails
    try {
      // Fetch gh-pages to check existing PRs
      try {
        await $`git fetch origin gh-pages:refs/remotes/origin/gh-pages`
      } catch (e) {
        // Ignore fetch errors - might not exist yet
      }

      // Get all PR directories from gh-pages
      let prDirs: string[] = []
      try {
        const output = await $`git ls-tree -d --name-only origin/gh-pages`
        prDirs = output.stdout
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
      return prDirs.map(dir => ({
        number: dir.replace('pr-', ''),
      }))
    } catch (error) {
      // Return empty array on error
      return []
    }
  }
}
