import * as path from 'node:path'
import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { getPRDeployments } from '../../scripts/lib/git/get-pr-deployments.ts'
import { Step } from '../types.ts'

interface Inputs {
  mode?: 'trunk' | 'pr-index'
  output_dir?: string
}

/**
 * Update the demos index page in gh-pages
 *
 * Prerequisites:
 * - Main repo must be checked out
 * - gh-pages must be checked out to ./gh-pages subdirectory
 *
 * Inputs:
 * - mode: 'trunk' (default) or 'pr-index'
 * - output_dir: Output directory for pr-index mode
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
