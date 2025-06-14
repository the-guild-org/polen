// @ts-check
import { buildDemosForTag, deployDemos, updateDistTagContent } from '../../scripts/lib/build-demos.js'
import getDemoExamples from '../../scripts/tools/get-demo-examples.js'

/**
 * Rebuild demos for multiple versions
 *
 * @param {import('../../scripts/lib/async-function').AsyncFunctionArguments & { semver: typeof import('semver'), fs: typeof import('fs').promises }} args
 */
export default async ({ core, exec, semver, fs }) => {
  const versions = JSON.parse(process.env.VERSIONS_TO_BUILD)
  const distTags = JSON.parse(process.env.DIST_TAGS)

  // Get list of demo examples
  const examples = getDemoExamples()
  console.log(`Building demos for examples: ${examples.join(', ')}`)

  // Get current branch to return to
  const currentBranch = await exec.getExecOutput('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
  const originalBranch = currentBranch.stdout.trim()

  // Check minimum version from config
  const demoConfig = JSON.parse(await fs.readFile('.github/demo-config.json', 'utf-8'))
  const minVersion = demoConfig.minimumVersion || '0.0.0'

  // Build each version
  for (const version of versions) {
    if (semver.lt(version, minVersion)) {
      console.log(`⚠️ Skipping ${version} - below minimum version ${minVersion}`)
      continue
    }

    console.log(`\n📦 Building ${version}...`)

    // Checkout the version
    await exec.exec('git', ['checkout', version])

    // Build Polen if needed
    try {
      await exec.exec('pnpm', ['build'])
    } catch (e) {
      console.log(`⚠️ Could not build Polen for ${version}, skipping`)
      continue
    }

    // Re-install to link workspace packages
    await exec.exec('pnpm', ['install'])

    // Build demos
    await buildDemosForTag({ tag: version, examples, exec, core })

    // Deploy to gh-pages
    await deployDemos({
      tag: version,
      examples,
      targetDir: 'gh-pages',
    })
  }

  // Return to main branch
  await exec.exec('git', ['checkout', originalBranch])

  // Update dist-tags
  for (const [distTag, semverTag] of Object.entries(distTags)) {
    console.log(`\n🏷️ Updating ${distTag} -> ${semverTag}`)

    // Check if we need to build the semver first
    const semverPath = `gh-pages/${semverTag}`
    try {
      await fs.access(semverPath)
    } catch {
      console.log(`Building ${semverTag} first...`)

      await exec.exec('git', ['checkout', semverTag])
      await exec.exec('pnpm', ['build'])
      await exec.exec('pnpm', ['install'])
      await buildDemosForTag({ tag: semverTag, examples, exec, core })
      await deployDemos({ tag: semverTag, examples, targetDir: 'gh-pages' })
      await exec.exec('git', ['checkout', originalBranch])
    }

    // Update dist-tag content
    await updateDistTagContent({
      ghPagesDir: 'gh-pages',
      distTag,
      semverTag,
      exec,
    })
  }
}
