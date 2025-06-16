import { Step } from '../types.ts'

interface Inputs {
  pr_number: string
  current_sha: string
}

/**
 * Get previous PR deployments using GitHub Deployments API
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
      if (statuses.length > 0 && statuses[0]!.state === 'success') {
        previousDeployments.push({
          sha: deployment.sha.substring(0, 7),
          url: statuses[0]!.environment_url || '',
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
    console.error('Error fetching deployments:', error)
    core.setOutput('deployment_links', '(none)')
  }
})
