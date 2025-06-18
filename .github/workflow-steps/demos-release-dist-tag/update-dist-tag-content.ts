import { demoBuilder } from '../../../src/lib/demos/builder.ts'
import { Step } from '../types.ts'

interface Inputs {
  tag_name: string
  semver_tag: string
}

/**
 * Update dist-tag content by copying from semver deployment
 * This handles when npm dist-tags are moved to different versions
 */
export default Step<Inputs>(async ({ core, inputs, $ }) => {
  try {
    const { tag_name, semver_tag } = inputs

    const semverPath = `gh-pages/${semver_tag}`
    const distTagPath = `gh-pages/${tag_name}`

    // Check if the semver deployment exists
    if (await $`test -d ${semverPath}`.exitCode !== 0) {
      core.setFailed(`Deployment for ${semver_tag} not found in gh-pages`)
      return
    }

    core.info(`Updating ${tag_name} to contain content from ${semver_tag}`)

    // Remove old dist-tag directory if it exists
    if (await $`test -d ${distTagPath}`.exitCode === 0) {
      core.debug(`Removing old ${tag_name} directory`)
      await $`rm -rf ${distTagPath}`
    }

    // Copy the semver deployment to the dist-tag name
    core.debug(`Copying ${semver_tag} to ${tag_name}`)
    await $`cp -r ${semverPath} ${distTagPath}`

    // Update base paths using DemoBuilder
    await demoBuilder.updateBasePaths(
      distTagPath,
      `/polen/${semver_tag}/`,
      `/polen/${tag_name}/`,
    )

    core.info(`✅ Successfully updated ${tag_name} with content from ${semver_tag}`)
  } catch (error) {
    core.setFailed(`Failed to update dist-tag content: ${error}`)
  }
})
