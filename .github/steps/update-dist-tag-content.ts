import { z } from 'zod/v4'
import { defineStep } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const Inputs = z.object({
  previous: z.object({
    tag_name: z.string(),
    semver_tag: z.string(),
  }),
})

const Outputs = z.object({
  update_complete: z.string(),
})

/**
 * Update dist-tag content by copying from semver deployment
 */
export default defineStep({
  name: 'update-dist-tag-content',
  description: 'Copy content from semver deployment to dist-tag directory',
  inputs: Inputs,
  outputs: Outputs,
  async run({ inputs }) {
    const { tag_name, semver_tag } = inputs.previous

    await demoOrchestrator.updateDistTag(tag_name, semver_tag)

    return {
      update_complete: 'true',
    }
  },
})
