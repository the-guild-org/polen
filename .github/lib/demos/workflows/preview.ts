/**
 * Unified workflow steps for PR demo previews
 */

import { z } from 'zod'
import { defineWorkflowStep } from '../../../../src/lib/github-actions/index.js'
import { demoOrchestrator } from '../orchestrator.ts'
import { getDemoExamples } from '../../../scripts/tools/get-demo-examples.ts'

// Input/Output schemas
const PreparePrDeploymentInputs = z.object({
  pr_number: z.string(),
  head_sha: z.string(),
  head_ref: z.string(),
})

const PreparePrDeploymentOutputs = z.object({
  deployment_ready: z.string(),
})

const GenerateDemoLinksInputs = z.object({
  pr_number: z.string(),
  head_sha: z.string(),
  github_repository_owner: z.string(),
  github_repository_name: z.string(),
  previous_deployment_links: z.string(),
})

const GenerateDemoLinksOutputs = z.object({
  links: z.string(),
})

const GetPreviousDeploymentsInputs = z.object({
  pr_number: z.string(),
  head_sha: z.string(),
})

const GetPreviousDeploymentsOutputs = z.object({
  deployment_links: z.string(),
})

/**
 * Prepare PR preview deployment
 */
export const preparePrDeployment = defineWorkflowStep({
  name: 'prepare-pr-deployment',
  description: 'Prepare PR preview deployment by organizing built demos into deployment structure',
  inputs: PreparePrDeploymentInputs,
  outputs: PreparePrDeploymentOutputs,
  
  async execute({ core, inputs }) {
    const { pr_number, head_sha, head_ref } = inputs

    core.info(`Preparing deployment for PR #${pr_number}`)

    const result = await demoOrchestrator.buildForPR(pr_number, head_sha, head_ref)

    if (!result.success) {
      const errorMessages = result.errors.map(e => e.message).join(', ')
      throw new Error(`Failed to prepare PR deployment: ${errorMessages}`)
    }

    core.info('✅ PR preview deployment prepared successfully')

    return {
      deployment_ready: 'true',
    }
  },
})

/**
 * Generate demo links for PR comments
 */
export const generateDemoLinks = defineWorkflowStep({
  name: 'generate-demo-links',
  description: 'Generate markdown links for all demo examples in a PR preview',
  inputs: GenerateDemoLinksInputs,
  outputs: GenerateDemoLinksOutputs,
  
  async execute({ core, inputs }) {
    const {
      pr_number,
      head_sha,
      github_repository_owner,
      github_repository_name,
      previous_deployment_links,
    } = inputs

    // Get list of demos
    const examples = await getDemoExamples()
    
    // Get short SHA
    const shortSha = head_sha.substring(0, 7)

    // Generate markdown for each demo
    const demoLinks = examples.map(example => {
      // Capitalize first letter for display
      const displayName = example.charAt(0).toUpperCase() + example.slice(1)

      return `#### ${displayName}
- [Latest](https://${github_repository_owner}.github.io/${github_repository_name}/pr-${pr_number}/latest/${example}/) – [\`${shortSha}\`](https://${github_repository_owner}.github.io/${github_repository_name}/pr-${pr_number}/${head_sha}/${example}/)
- Previous: ${previous_deployment_links}
`
    }).join('\\n')

    return {
      links: demoLinks,
    }
  },
})

/**
 * Get previous PR deployments for comparison
 */
export const getPreviousDeployments = defineWorkflowStep({
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