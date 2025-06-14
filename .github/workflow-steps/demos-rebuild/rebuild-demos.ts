import * as semver from 'semver'
import { buildDemosForTag, deployDemos, updateDistTagContent } from '../../scripts/lib/build-demos.ts'
import { getDemoExamples } from '../../scripts/tools/get-demo-examples.ts'
import { type RebuildInputs, Step } from '../types.ts'

/**
 * Rebuild demos for multiple versions
 */
export default Step<RebuildInputs>(async ({ core, $, inputs, fs }) => {
  console.log('DEBUG: Raw inputs object:', inputs)
  console.log('DEBUG: inputs type:', typeof inputs)
  console.log('DEBUG: inputs keys:', Object.keys(inputs))
  
  console.log('DEBUG: versions_to_build type:', typeof inputs.versions_to_build)
  console.log('DEBUG: versions_to_build value:', inputs.versions_to_build)
  console.log('DEBUG: versions_to_build is array?', Array.isArray(inputs.versions_to_build))
  
  console.log('DEBUG: dist_tags type:', typeof inputs.dist_tags)
  console.log('DEBUG: dist_tags value:', inputs.dist_tags)
  
  const versions = inputs.versions_to_build
  const distTags = inputs.dist_tags

  // Get list of demo examples
  const examples = await getDemoExamples()
  console.log(`Building demos for examples: ${examples.join(', ')}`)

  // Get current branch to return to
  const originalBranch = (await $`git rev-parse --abbrev-ref HEAD`).stdout.trim()

  // Check minimum version from config
  const demoConfig = JSON.parse(
    await fs.readFile('.github/demo-config.json', 'utf-8'),
  )
  const minVersion = demoConfig.minimumVersion || '0.0.0'

  // Build each version
  for (const version of versions) {
    if (semver.lt(version, minVersion)) {
      console.log(
        `⚠️ Skipping ${version} - below minimum version ${minVersion}`,
      )
      continue
    }

    console.log(`\n📦 Building ${version}...`)

    // Checkout the version
    await $`git checkout ${version}`

    // Build Polen if needed
    try {
      await $`pnpm build`
    } catch {
      console.log(`⚠️ Could not build Polen for ${version}, skipping`)
      continue
    }

    // Re-install to link workspace packages
    await $`pnpm install`

    // Build demos
    await buildDemosForTag({ tag: version, examples, $, core })

    // Deploy to gh-pages
    await deployDemos({
      tag: version,
      examples,
      targetDir: 'gh-pages',
    })
  }

  // Return to main branch
  await $`git checkout ${originalBranch}`

  // Update dist-tags
  for (const [distTag, semverTag] of Object.entries(distTags)) {
    console.log(`\n🏷️ Updating ${distTag} -> ${semverTag}`)

    // Check if we need to build the semver first
    const semverPath = `gh-pages/${semverTag}`
    try {
      await fs.access(semverPath)
    } catch {
      console.log(`Building ${semverTag} first...`)

      await $`git checkout ${semverTag}`
      await $`pnpm build`
      await $`pnpm install`
      await buildDemosForTag({ tag: semverTag, examples, $, core })
      await deployDemos({ tag: semverTag, examples, targetDir: 'gh-pages' })
      await $`git checkout ${originalBranch}`
    }

    // Update dist-tag content
    await updateDistTagContent({
      ghPagesDir: 'gh-pages',
      distTag,
      semverTag,
      $,
    })
  }
})
