import { z } from 'zod/v4'
import { defineWorkflowStep } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const Inputs = z.object({
  tag: z.string(),
  actual_tag: z.string().optional(),
})

const Outputs = z.object({
  build_complete: z.string(),
})

/**
 * Build demos for a release
 */
export default defineWorkflowStep({
  name: 'build-demos',
  description: 'Build demo sites for a newly released Polen version',
  inputs: Inputs,
  outputs: Outputs,
  async execute({ inputs }) {
    const tag = inputs.actual_tag || inputs.tag

    const result = await demoOrchestrator.buildForRelease(tag)

    if (!result.success) {
      const errorMessages = result.errors.map(e => e.message).join(', ')
      throw new Error(`Failed to build demos: ${errorMessages}`)
    }

    return {
      build_complete: 'true',
    }
  },
})
