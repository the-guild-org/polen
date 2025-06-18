import { Str } from '@wollybeard/kit'
import { z } from 'zod/v4'
import { getDemoExamples } from '../../../src/lib/demos/index.ts'
import { defineStep } from '../../../src/lib/github-actions/index.ts'

const Inputs = z.object({
  pr_number: z.string(),
  head_sha: z.string(),
})

/**
 * Create or update PR comment with demo links
 */
export default defineStep({
  name: 'pr-comment',
  description: 'Create or update PR comment with demo preview links',
  inputs: Inputs,
  async run({ core, inputs, github, context, pr }) {
    const {
      pr_number,
      head_sha,
    } = inputs

    let previousDeploymentsText: string
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
        previousDeploymentsText = '(none)'
      }

      // Format as markdown links
      const links = previousDeployments.map(deployment => `[\`${deployment.sha}\`](${deployment.url})`)

      previousDeploymentsText = links.join(' / ')
    } catch (error) {
      core.error(`Error fetching deployments: ${error}`)
      previousDeploymentsText = '(none)'
    }

    // Get list of demos
    const examples = await getDemoExamples()

    // Get short SHA
    const shortSha = head_sha.substring(0, 7)

    // Generate markdown for each demo
    const demosText = examples.map(example => {
      const displayName = Str.Case.title(example)
      const baseUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${pr_number}`

      let text = ''
      text += `#### ${displayName}\n`
      // dprint-ignore
      text += `- Latest: [View Demo](${baseUrl}/latest/${example}/) • [Commit ${shortSha}](${baseUrl}/${head_sha}/${example}/)\n`
      text += `- Previous: ${previousDeploymentsText}`
      return text
    }).join('\n')

    // Create the full comment content
    const baseUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${pr_number}`
    const commentContent = `## Polen Demos Preview

**Preview URL:** ${baseUrl}/

### Available Demos
${demosText}`

    await pr.comment({
      content: commentContent,
    })

    core.info('✅ PR comment created/updated successfully')
  },
})
