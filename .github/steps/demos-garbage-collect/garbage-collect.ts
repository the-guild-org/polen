import { GitHubActions } from '#lib/github-actions/index'
import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'
import { DeploymentPathManager } from '../../lib/demos/path-manager.ts'

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
    core.info('🗑️  Starting garbage collection of old demos')

    const pathManager = new DeploymentPathManager()

    // Get current development cycle versions to keep
    const currentCycle = await VersionHistory.getCurrentDevelopmentCycle()
    const versionsToKeep = currentCycle.all.map(v => v.git.tag)

    // Also keep all stable versions
    const allVersions = await VersionHistory.getVersions()
    const stableVersions = allVersions.filter(v => !v.isPrerelease).map(v => v.git.tag)

    // Combine versions to keep
    const keepVersions = [...new Set([...versionsToKeep, ...stableVersions])]

    core.info(`Keeping ${keepVersions.length} versions: ${keepVersions.join(', ')}`)

    // Determine the gh-pages directory to clean
    const ghPagesDir = process.env['WORKING_DIR'] || 'gh-pages'
    core.debug(`Operating on directory: ${ghPagesDir}`)

    // Clean up deployments (removes everything except keepVersions)
    const result = await pathManager.cleanupOldDeployments(
      ghPagesDir,
      keepVersions,
      false, // Not a dry run
    )

    if (result.removed.length > 0) {
      core.info(`✅ Removed ${result.removed.length} old deployments: ${result.removed.join(', ')}`)
    } else {
      core.info('✅ No old deployments to remove')
    }

    if (result.errors.length > 0) {
      core.error(`Errors during cleanup: ${result.errors.join(', ')}`)
    }

    const committed = await git.commit({
      message: 'chore(demos): garbage collect past development cycle deployments',
      body: `Removed: ${result.removed.join(', ')}`,
      cwd: 'gh-pages',
      push: true,
    })

    if (committed) {
      core.info('✅ Changes committed and pushed successfully')
    } else {
      core.info('No changes to commit after garbage collection')
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
