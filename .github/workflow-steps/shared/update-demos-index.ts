import * as path from 'node:path'
import { getDistTags } from '../../scripts/lib/git/get-dist-tags.ts'
import { getPRDeployments } from '../../scripts/lib/git/get-pr-deployments.ts'
import { getVersionHistory } from '../../scripts/lib/git/get-version-history.ts'
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
      // Get version history from git tags
      const trunkDeployments = JSON.stringify(await getVersionHistory())

      // Get dist-tags info from gh-pages directory
      const distTags = JSON.stringify(await getDistTags('./gh-pages'))

      // Build trunk demos index
      await $`node ./scripts/build-demos-index.ts --trunkDeployments=${trunkDeployments} --distTags=${distTags}`

      // Copy to gh-pages root
      await fs.copyFile('dist-demos/index.html', 'gh-pages/index.html')

      console.log('✅ Trunk demos index updated successfully')
      return
    }

    // mode === 'pr-index'
    // Get PR deployments from gh-pages
    const prDeployments = JSON.stringify(await getPRDeployments())

    // Build PR index
    await $`node ./scripts/build-demos-index.ts --mode pr-index --prDeployments=${prDeployments}`

    // Determine output path based on input
    const outputPath = inputs.output_dir
      ? path.join(inputs.output_dir, 'pr-index.html')
      : 'gh-pages/pr-index.html'

    await fs.copyFile('dist-demos/pr-index.html', outputPath)

    console.log(`✅ PR demos index updated successfully at ${outputPath}`)
  } catch (error) {
    core.setFailed(`Failed to update demos index: ${(error as Error).message}`)
  }
})
