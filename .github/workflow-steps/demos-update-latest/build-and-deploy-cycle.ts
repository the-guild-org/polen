import { demoBuilder } from '../../../src/lib/demos/builder.js'
import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { Step } from '../types.ts'

interface Inputs {
  versions_to_rebuild: string
}

/**
 * Build and deploy demos for the current development cycle
 * Handles both building and deployment in one step to avoid complex bash
 */
export default Step<Inputs>(async ({ core, inputs, $ }) => {
  core.startGroup('Build and deploy development cycle')

  try {
    // Parse versions from JSON string
    const versions = JSON.parse(inputs.versions_to_rebuild || '[]') as string[]

    if (versions.length === 0) {
      core.setFailed('No versions to rebuild')
      return
    }

    core.info(`Building and deploying demos for ${versions.length} versions: ${versions.join(', ')}`)

    // Build demos for each version
    const failedVersions: string[] = []

    for (const version of versions) {
      try {
        core.info(`📦 Building demos for version ${version}...`)

        const basePath = VersionHistory.getDeploymentPath(version)

        // Build demos landing page
        core.debug(`Building demos landing page for ${version}...`)
        await $`node --no-warnings --experimental-transform-types ./scripts/build-demos-home.ts --basePath ${basePath}`

        // Build each example
        await demoBuilder.build(version, { basePath })
      } catch (error) {
        core.error(`Failed to build demos for ${version}: ${error}`)
        failedVersions.push(version)
        // Continue with other versions
      }
    }

    if (failedVersions.length === versions.length) {
      core.setFailed('All version builds failed')
      return
    }

    // Deploy to gh-pages
    core.info('🚀 Deploying to gh-pages...')

    for (const version of versions) {
      const isStable = VersionHistory.isStableVersion(version)
      const targetDir = isStable ? 'gh-pages/latest' : `gh-pages/${version}`

      // Remove old directory if exists
      await $`rm -rf ${targetDir}`
      await $`mkdir -p ${targetDir}`

      // Copy demos landing page
      if (await $`test -f ../dist-demos/index.html`.exitCode === 0) {
        await $`cp ../dist-demos/index.html ${targetDir}/`
      }

      // Copy built demos
      const examplesOutput = await $`node --no-warnings ../.github/scripts/tools/get-demo-examples.ts`
      const examples = examplesOutput.stdout.trim().split(' ')

      for (const example of examples) {
        const buildDir = `../examples/${example}/build`
        if (await $`test -d ${buildDir}`.exitCode === 0) {
          await $`mkdir -p ${targetDir}/${example}`
          await $`cp -r ${buildDir}/* ${targetDir}/${example}/`
        }
      }
    }

    core.setOutput('deploy_complete', 'true')
    core.info(`✅ Successfully built and deployed demos for development cycle`)
    core.endGroup()
  } catch (error) {
    core.endGroup()
    core.setFailed(`Failed to build and deploy cycle: ${error}`)
  }
})
