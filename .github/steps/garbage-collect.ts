import { z } from 'zod/v4'
import { GitHubActions } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const Outputs = z.object({
  removed: z.array(z.string()),
  removed_count: z.number(),
  has_changes: z.boolean(),
  removed_deployments: z.string(), // For backwards compatibility
})

/**
 * Garbage collect old demo deployments
 */
export default GitHubActions.createStep({
  name: 'garbage-collect',
  description: 'Remove old demo deployments to save space',
  inputs: z.object({}),
  outputs: Outputs,
  async run({ core }) {
    const result = await demoOrchestrator.garbageCollect()

    if (result.removed.length > 0) {
      core.info(`✅ Removed ${result.removed.length} old deployments: ${result.removed.join(', ')}`)
    } else {
      core.info('✅ No old deployments to remove')
    }

    if (result.errors.length > 0) {
      core.error(`Errors during cleanup: ${result.errors.join(', ')}`)
    }

    return {
      removed: result.removed,
      removed_count: result.removed.length,
      has_changes: result.removed.length > 0,
      removed_deployments: result.removed.join(', '), // For backwards compatibility
    }
  },
})
