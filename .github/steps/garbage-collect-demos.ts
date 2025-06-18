import { z } from 'zod/v4'
import { defineStep, ReleaseContext } from '../../src/lib/github-actions/index.ts'

const Inputs = z.object({})

const Outputs = z.object({
  removed_count: z.number(),
})

/**
 * Garbage collect old demo deployments
 */
export default defineStep({
  name: 'garbage-collect-demos',
  description: 'Remove old demo deployments based on retention policy',
  inputs: Inputs,
  outputs: Outputs,
  context: ReleaseContext,
  async run({ core, github, context }) {
    core.info('Starting garbage collection of old demo deployments')

    // TODO: Implement actual GC logic
    // For now, just log what we would do
    core.info('Garbage collection not yet implemented')
    core.info('Would remove old prereleases outside current development cycle')

    return {
      removed_count: 0,
    }
  },
})
