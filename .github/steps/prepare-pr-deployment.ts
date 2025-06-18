import { z } from 'zod/v4'
import { defineWorkflowStep } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const Inputs = z.object({
  pr_number: z.string(),
  head_sha: z.string(),
  head_ref: z.string(),
})

const Outputs = z.object({
  deployment_ready: z.string(),
})

/**
 * Prepare PR preview deployment
 */
export default defineWorkflowStep({
  name: 'prepare-pr-deployment',
  description: 'Prepare PR preview deployment by organizing built demos into deployment structure',
  inputs: Inputs,
  outputs: Outputs,
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
