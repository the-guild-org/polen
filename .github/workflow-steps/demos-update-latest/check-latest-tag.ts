import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { Step } from '../types.ts'

// todo allow specifying a type for outputs which will make core.setOutput type-safe.
export default Step(async ({ core }) => {
  const versionHistory = new VersionHistory()

  try {
    // Get the current development cycle
    const cycle = await versionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      core.setOutput('has_versions', 'false')
      core.warning('No stable release found - skipping update')
      return
    }

    // Check if latest dist-tag exists and matches the stable release
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
