// @ts-check
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execNodeScript } from '../lib/exec-utils.js'

/**
 * Update the demos index page in gh-pages
 *
 * Prerequisites:
 * - Main repo must be checked out
 * - gh-pages must be checked out to ./gh-pages subdirectory
 *
 * Environment variables:
 * - MODE: 'trunk' (default) or 'pr-index'
 * - PR_DEPLOYMENTS: JSON string of PR deployments (for pr-index mode)
 *
 * @param {import('../lib/async-function').AsyncFunctionArguments} args
 */
export default async ({ exec, core }) => {

  const mode = process.env.MODE || 'trunk'

  try {
    if (mode !== 'trunk' && mode !== 'pr-index') {
      throw new Error(`Unknown mode: ${mode}`)
    }

    if (mode === 'trunk') {
      // Get trunk deployments info from gh-pages directory
      const trunkDeployments = await execNodeScript(exec, './.github/scripts/tools/get-trunk-deployments.js', [
        './gh-pages',
      ])

      // Build trunk demos index
      await exec.exec('node', ['./scripts/build-demos-index.ts', '--trunkDeployments', trunkDeployments])

      // Copy to gh-pages root
      await fs.copyFile('dist-demos/index.html', 'gh-pages/index.html')

      console.log('✅ Trunk demos index updated successfully')
      return
    }

    // mode === 'pr-index'
    // Get PR deployments from gh-pages
    const prDeployments = await execNodeScript(exec, './.github/scripts/tools/get-pr-deployments.js')

    // Build PR index
    await exec.exec('node', ['./scripts/build-demos-index.ts', '--mode', 'pr-index', '--prDeployments', prDeployments])

    // Determine output path based on environment
    const outputPath = process.env.OUTPUT_DIR
      ? path.join(process.env.OUTPUT_DIR, 'pr-index.html')
      : 'gh-pages/pr-index.html'

    await fs.copyFile('dist-demos/pr-index.html', outputPath)

    console.log(`✅ PR demos index updated successfully at ${outputPath}`)
  } catch (error) {
    core.setFailed(`Failed to update demos index: ${error.message}`)
  }
}
