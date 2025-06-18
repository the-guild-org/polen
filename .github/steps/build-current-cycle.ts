import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'
import { GitHubActions } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

// const jsonString = <T>(schema: z.ZodSchema<T>) => z.string().transform(s => schema.parse(JSON.parse(s)))

const Outputs = z.object({
  did: z.boolean(),
})

/**
 * Build demos for current development cycle
 */
export default GitHubActions.createStep({
  name: 'build-current-cycle',
  description: 'Build demos for all versions in the current development cycle',
  // inputs: Inputs,
  outputs: Outputs,
  async run({ core }) {
    //
    //
    //
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Check Latest Tag
    //
    //

    const versionHistory = new VersionHistory()

    // Get the current development cycle
    const cycle = await versionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      core.warning('No stable version found - skipping update')
      return {
        did: false,
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

    // return {
    //   has_versions: 'true',
    //   versions_to_rebuild: JSON.stringify(versions),
    // }

    //
    //
    //
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Build
    //
    //

    // const versions = inputs.previous.versions_to_rebuild

    if (versions.length === 0) {
      throw new Error('No versions to rebuild')
    }

    core.info(`Building demos for ${versions.length} versions: ${versions.join(', ')}`)

    const result = await demoOrchestrator.buildCurrentCycle()

    if (result.failedVersions.length > 0) {
      core.error(`Failed to build ${result.failedVersions.length} versions: ${result.failedVersions.join(', ')}`)
    }

    if (!result.success) {
      throw new Error('All version builds failed')
    }

    return {
      did: true,
    }
  },
})
