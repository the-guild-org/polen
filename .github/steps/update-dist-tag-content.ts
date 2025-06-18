import { z } from 'zod/v4'
import { defineWorkflowStep } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const UpdateDistTagContentInputs = z.object({
  tag_name: z.string(),
  semver_tag: z.string(),
})

const UpdateDistTagContentOutputs = z.object({
  update_complete: z.string(),
})

/**
 * Update dist-tag content by copying from semver deployment
 */
export default defineWorkflowStep({
  name: 'update-dist-tag-content',
  description: 'Copy content from semver deployment to dist-tag directory',
  inputs: UpdateDistTagContentInputs,
  outputs: UpdateDistTagContentOutputs,

  async execute({ inputs }) {
    const { tag_name, semver_tag } = inputs

    await demoOrchestrator.updateDistTag(tag_name, semver_tag)

    return {
      update_complete: 'true',
    }
  },
})
