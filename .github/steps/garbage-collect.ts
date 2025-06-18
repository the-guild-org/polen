import { z } from 'zod/v4'
import { GitHubActions } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const Outputs = z.object({
  removed: z.array(z.string()),
  removed_count: z.number(),
  has_changes: z.boolean(),
  removed_deployments: z.string(), // For backwards compatibility
  committed: z.boolean(),
})

/**
 * Garbage collect old demo deployments
 */
export default GitHubActions.createStep({
  description: 'Remove old demo deployments to save space and commit changes',
  inputs: z.object({}),
  outputs: Outputs,
  async run({ core, git }) {
    const result = await demoOrchestrator.garbageCollect()

    if (result.removed.length > 0) {
      core.info(`✅ Removed ${result.removed.length} old deployments: ${result.removed.join(', ')}`)
    } else {
      core.info('✅ No old deployments to remove')
    }

    if (result.errors.length > 0) {
      core.error(`Errors during cleanup: ${result.errors.join(', ')}`)
    }

    // Commit changes if there are any
    let committed = false
    if (result.removed.length > 0) {
      try {
        // Check if there are changes and commit them
        const hasChanges = await git.hasChanges('gh-pages')

        if (hasChanges) {
          committed = await git.commit({
            message: 'chore(demos): garbage collect past development cycle deployments',
            body: `Removed: ${result.removed.join(', ')}`,
            cwd: 'gh-pages',
            push: true,
          })

          if (committed) {
            core.info('✅ Changes committed and pushed successfully')
          }
        } else {
          core.info('No changes to commit after garbage collection')
        }
      } catch (error) {
        core.error(`Failed to commit changes: ${error}`)
        throw error
      }
    }

    return {
      removed: result.removed,
      removed_count: result.removed.length,
      has_changes: result.removed.length > 0,
      removed_deployments: result.removed.join(', '), // For backwards compatibility
      committed,
    }
  },
})
