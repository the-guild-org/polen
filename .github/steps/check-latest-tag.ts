import { z } from 'zod/v4'
import { defineStep } from '../../src/lib/github-actions/index.ts'
import { VersionHistory } from '../../src/lib/version-history/index.ts'

const Outputs = z.object({
  has_versions: z.string(),
  versions_to_rebuild: z.string(),
})

/**
 * Check current development cycle and prepare versions for rebuilding
 */
export default defineStep({
  name: 'check-latest-tag',
  description: 'Identify all versions in the current development cycle that need demo updates',
  outputs: Outputs,
  async run({ core }) {
    const versionHistory = new VersionHistory()

    // Get the current development cycle
    const cycle = await versionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      core.warning('No stable version found - skipping update')
      return {
        has_versions: 'false',
        versions_to_rebuild: '[]',
      }
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

    const versions = cycle.all.map(v => v.tag)
    const versionList = versions.join(', ')

    core.info(`✅ Found ${cycle.all.length} versions to rebuild: ${versionList}`)
    core.info(`  Latest stable: ${cycle.stable.tag}`)
    if (cycle.prereleases.length > 0) {
      core.info(`  Prereleases: ${cycle.prereleases.map(v => v.tag).join(', ')}`)
    }

    return {
      has_versions: 'true',
      versions_to_rebuild: JSON.stringify(versions),
    }
  },
})
