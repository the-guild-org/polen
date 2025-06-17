import { Step } from '../types.ts'

interface Inputs {
  pr_number: string
  current_sha: string
}

/**
 * Retrieve previous successful PR demo deployments for comparison links
 *
 * WHAT: Fetches deployment history from GitHub Deployments API for this PR
 * WHY: Allows reviewers to compare current changes against previous demo versions
 *
 * Uses GitHub's Deployments API to find successful deployments to the PR environment
 * that aren't the current commit. This provides "Previous:" links in PR comments
 * showing earlier demo versions for comparison.
 *
 * Filters to only successful deployments and excludes the current SHA to avoid
 * showing duplicate links. Results are sorted by creation date (newest first).
 *
 * Output: deployment_links - Formatted markdown links like "`abc1234`(url) / `def5678`(url)"
 */
export default Step<Inputs>(async ({ github, context, core, inputs }) => {
  const prNumber = inputs.pr_number
  const currentSha = inputs.current_sha

  try {
    // Get deployments for this PR's environment
    const { data: deployments } = await github.rest.repos.listDeployments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      environment: `pr-${prNumber}`,
      per_page: 100,
    })

    // Filter out current deployment and get successful ones
    const previousDeployments = []

    for (const deployment of deployments) {
      // Skip current SHA
      if (deployment.sha === currentSha || deployment.sha.startsWith(currentSha)) {
        continue
      }

      // Check deployment status
      const { data: statuses } = await github.rest.repos.listDeploymentStatuses({
        owner: context.repo.owner,
        repo: context.repo.repo,
        deployment_id: deployment.id,
        per_page: 1,
      })

      // Only include successful deployments
      const firstStatus = statuses[0]
      if (statuses.length > 0 && firstStatus && firstStatus.state === 'success') {
        previousDeployments.push({
          sha: deployment.sha.substring(0, 7),
          url: firstStatus.environment_url || '',
          created_at: deployment.created_at,
        })
      }
    }

    // Sort by creation date (newest first)
    previousDeployments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (previousDeployments.length === 0) {
      core.setOutput('deployment_links', '(none)')
      return
    }

    // Format as markdown links
    const links = previousDeployments.map(deployment => `[\`${deployment.sha}\`](${deployment.url})`)

    core.setOutput('deployment_links', links.join(' / '))
  } catch (error) {
    core.error(`Error fetching deployments: ${error}`)
    core.setOutput('deployment_links', '(none)')
  }
})
