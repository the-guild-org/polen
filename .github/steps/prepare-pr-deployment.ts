import { z } from 'zod/v4'
import { GitHubActions } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const Outputs = z.object({
  deployment_ready: z.boolean(),
})

/**
 * Prepare PR preview deployment
 */
export default GitHubActions.createStep({
  description: 'Prepare PR preview deployment by organizing built demos into deployment structure',
  outputs: Outputs,
  context: GitHubActions.PullRequestContext,
  async run({ core, context }) {
    const pr_number = context.payload.pull_request.number.toString()
    const head_sha = context.payload.pull_request.head.sha
    const head_ref = context.payload.pull_request.head.ref

    core.info(`Preparing deployment for PR #${pr_number}`)

    const result = await demoOrchestrator.buildForPR(pr_number, head_sha, head_ref)

    if (!result.success) {
      const errorMessages = result.errors.map(e => e.message).join(', ')
      throw new Error(`Failed to prepare PR deployment: ${errorMessages}`)
    }

    core.info('✅ PR preview deployment prepared successfully')

    return {
      deployment_ready: true,
    }
  },
})
