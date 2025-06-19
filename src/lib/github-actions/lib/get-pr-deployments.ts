import type { GitHub } from '@actions/github/lib/utils.ts'

export interface Deployment {
  sha: string
  shortSha: string
  createdAt: string
  status?: 'success' | 'failure' | 'in_progress'
  url?: string
}

/**
 * Fetch deployments for a specific PR using GitHub API
 */
export async function fetchPullRequestDeployments(
  github: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  prNumber: string | number,
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
