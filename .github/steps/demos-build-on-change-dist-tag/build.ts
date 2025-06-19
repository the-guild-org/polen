import { GitHubActions } from '#lib/github-actions/index'
import { promises as fs } from 'node:fs'
import { z } from 'zod/v4'
import { DeploymentPathManager } from '../../lib/demos/path-manager.ts'

const Inputs = z.object({
  previous: z.object({
    tag_name: z.string(),
    semver_tag: z.string(),
  }),
})

export default GitHubActions.createStep({
  description: 'Copy content from semver deployment to dist-tag directory',
  inputs: Inputs,
  async run({ inputs, core }) {
    const { tag_name: distTag, semver_tag: semverTag } = inputs.previous

    core.info(`🔄 Updating ${distTag} to point to ${semverTag}`)

    const semverPath = `gh-pages/${semverTag}`
    const distTagPath = `gh-pages/${distTag}`

    // Check if semver deployment exists
    try {
      await fs.access(semverPath)
    } catch {
      core.warning(`Semver deployment ${semverTag} not found at ${semverPath} - it may have been garbage collected`)
      // Skip updating if the source doesn't exist
      return
    }

    // Remove old dist-tag directory
    try {
      await fs.rm(distTagPath, { recursive: true, force: true })
      core.debug(`Removed old ${distTag} directory`)
    } catch {
      // Directory might not exist, that's fine
    }

    // Copy semver deployment to dist-tag path
    await fs.cp(semverPath, distTagPath, { recursive: true })
    core.debug(`Copied ${semverTag} to ${distTag}`)

    // Update base paths using the path manager
    const pathManager = new DeploymentPathManager()
    await pathManager.updateBasePaths(
      distTagPath,
      `/polen/${semverTag}/`,
      `/polen/${distTag}/`,
    )

    core.info(`✅ Successfully updated ${distTag} to ${semverTag}`)
  },
})
