import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { Step } from '../types.ts'

/**
 * Check current development cycle and prepare versions for demo rebuilding
 *
 * WHAT: Identifies all versions in the current development cycle that need demo updates
 * WHY: Ensures demos stay current when examples or Polen itself is updated
 *
 * Current development cycle includes:
 * - Latest stable version (always deployed to /latest/)
 * - All prereleases newer than latest stable (deployed to /{version}/)
 *
 * Also validates that npm's "latest" dist-tag points to the correct stable version,
 * warning if there's a mismatch (though this doesn't block the rebuild).
 *
 * Outputs:
 * - has_versions: 'true'/'false' - Whether any versions were found
 * - versions_to_rebuild: JSON array of version strings to rebuild
 *
 * @example
 * If latest stable is 1.2.0 and there are prereleases 1.3.0-alpha.1, 1.3.0-alpha.2:
 * versions_to_rebuild = ["1.2.0", "1.3.0-alpha.1", "1.3.0-alpha.2"]
 */
// todo allow specifying a type for outputs which will make core.setOutput type-safe.
export default Step(async ({ core }) => {
  const versionHistory = new VersionHistory()

  try {
    // Get the current development cycle
    const cycle = await versionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      core.setOutput('has_versions', 'false')
      core.warning('No stable version found - skipping update')
      return
    }

    // Check if latest dist-tag exists and matches the stable version
    const latestTag = await versionHistory.getDistTag('latest')
    if (!latestTag || latestTag.semverTag !== cycle.stable.tag) {
      core.warning(
        `Latest dist-tag ${
          latestTag ? `points to ${latestTag.semverTag}` : 'not found'
        }, but latest stable is ${cycle.stable.tag}`,
      )
    }

    core.setOutput('has_versions', 'true')
    core.setOutput('versions_to_rebuild', JSON.stringify(cycle.all.map(v => v.tag)))

    const versionList = cycle.all.map(v => v.tag).join(', ')
    core.info(`✅ Found ${cycle.all.length} versions to rebuild: ${versionList}`)
    core.info(`  Latest stable: ${cycle.stable.tag}`)
    if (cycle.prereleases.length > 0) {
      core.info(`  Prereleases: ${cycle.prereleases.map(v => v.tag).join(', ')}`)
    }
  } catch (error) {
    core.setFailed(`Failed to get development cycle: ${error}`)
  }
})
