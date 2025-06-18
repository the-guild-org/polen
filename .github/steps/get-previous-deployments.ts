import { z } from 'zod/v4'
import { defineWorkflowStep } from '../../src/lib/github-actions/index.ts'

const GetPreviousDeploymentsInputs = z.object({
  pr_number: z.string(),
  head_sha: z.string(),
})

const GetPreviousDeploymentsOutputs = z.object({
  deployment_links: z.string(),
})

/**
 * Get previous PR deployments for comparison
 */
export default defineWorkflowStep({
  name: 'get-previous-deployments',
  description: 'Retrieve previous successful PR demo deployments for comparison links',
  inputs: GetPreviousDeploymentsInputs,
  outputs: GetPreviousDeploymentsOutputs,

  async execute({ github, context, core, inputs }) {
    const { pr_number, head_sha } = inputs

    try {
      // Get deployments for this PR's environment
      const { data: deployments } = await github.rest.repos.listDeployments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        environment: `pr-${pr_number}`,
        per_page: 100,
      })

      // Filter out current deployment and get successful ones
      const previousDeployments = []

      for (const deployment of deployments) {
        // Skip current SHA
        if (deployment.sha === head_sha || deployment.sha.startsWith(head_sha)) {
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
        return { deployment_links: '(none)' }
      }

      // Format as markdown links
      const links = previousDeployments.map(deployment => `[\`${deployment.sha}\`](${deployment.url})`)

      return { deployment_links: links.join(' / ') }
    } catch (error) {
      core.error(`Error fetching deployments: ${error}`)
      return { deployment_links: '(none)' }
    }
  },
})
