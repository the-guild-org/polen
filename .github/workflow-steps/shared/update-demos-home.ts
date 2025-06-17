import * as path from 'node:path'
import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { getPRDeployments } from '../../scripts/lib/git/get-pr-deployments.ts'
import { Step } from '../types.ts'

interface Inputs {
  mode?: 'trunk' | 'pr-index'
  output_dir?: string
}

/**
 * Generate and update the main demos landing page with current deployment info
 *
 * WHAT: Creates/updates the demos homepage that lists all available demo deployments
 * WHY: Provides a central directory for users to discover and access all demo versions
 *
 * Two modes:
 * 1. 'trunk' (default): Main landing page showing stable releases + current prereleases
 *    - Shows latest stable prominently with "latest" dist-tag
 *    - Lists previous versions for comparison
 *    - Displays current dist-tag assignments (latest, next, etc.)
 *
 * 2. 'pr-index': Special page showing all PR demo deployments
 *    - Lists active PR demos for development/testing
 *    - Shows commit SHAs and PR numbers for navigation
 *
 * Prerequisites:
 * - Main repo must be checked out (for accessing build scripts)
 * - gh-pages must be checked out to ./gh-pages subdirectory (for deployment)
 *
 * The generated page helps users understand:
 * - Which demos represent stable releases vs development versions
 * - How to access demos for specific features or bugs (PR demos)
 * - Version history and release progression
 */
export default Step<Inputs>(async ({ $, core, inputs, fs }) => {
  const mode = inputs.mode || 'trunk'

  try {
    if (mode !== 'trunk' && mode !== 'pr-index') {
      throw new Error(`Unknown mode: ${mode}`)
    }

    if (mode === 'trunk') {
      // Initialize version history
      const versionHistory = new VersionHistory()

      // Get all versions and format for build-demos-home
      const allVersions = await versionHistory.getVersions()
      const latestStable = await versionHistory.getLatestStableVersion()

      // Format trunk deployments in the expected structure
      const trunkDeployments = {
        latest: latestStable
          ? {
            sha: latestStable.commit,
            shortSha: latestStable.commit.substring(0, 7),
            tag: latestStable.tag,
          }
          : null,
        previous: allVersions
          .filter(v => v.tag !== latestStable?.tag)
          .slice(0, 10)
          .map(v => ({
            sha: v.commit,
            shortSha: v.commit.substring(0, 7),
            tag: v.tag,
          })),
      }

      // Get dist-tags info
      const distTagInfos = await versionHistory.getDistTags()
      const distTags: Record<string, string> = {}
      for (const info of distTagInfos) {
        if (info.semverTag) {
          distTags[info.name] = info.semverTag
        }
      }

      // Build trunk demos index
      await $`node ./scripts/build-demos-home.ts --trunkDeployments=${JSON.stringify(trunkDeployments)} --distTags=${
        JSON.stringify(distTags)
      }`

      // Copy to gh-pages root
      await fs.copyFile('dist-demos/index.html', 'gh-pages/index.html')

      core.info('✅ Trunk demos index updated successfully')
      return
    }

    // mode === 'pr-index'
    // Get PR deployments from gh-pages
    const prDeployments = JSON.stringify(await getPRDeployments())

    // Build PR index
    await $`node ./scripts/build-demos-home.ts --mode pr-index --prDeployments=${prDeployments}`

    // Determine output path based on input
    const outputPath = inputs.output_dir
      ? path.join(inputs.output_dir, 'pr-index.html')
      : 'gh-pages/pr-index.html'

    await fs.copyFile('dist-demos/pr-index.html', outputPath)

    core.info(`✅ PR demos index updated successfully at ${outputPath}`)
  } catch (error) {
    core.setFailed(`Failed to update demos index: ${(error as Error).message}`)
  }
})
