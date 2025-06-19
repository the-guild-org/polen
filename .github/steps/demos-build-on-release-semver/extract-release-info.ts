import { GitHubActions } from '#lib/github-actions/index'
import { z } from 'zod/v4'

const ExtractReleaseInfoOutputs = z.object({
  tag: z.string(),
  is_prerelease: z.boolean(),
  action: z.string(),
})

export default GitHubActions.createStep({
  outputs: ExtractReleaseInfoOutputs,
  context: GitHubActions.ReleaseContext,
  async run({ core, context }) {
    // Get tag from release event
    const tag = context.payload.release.tag_name
    const releaseAction = context.payload.action

    // Track tags for debugging
    core.info(`Analyzing release: ${tag} (action: ${releaseAction})`)

    // Validate that this is a semver tag
    const semverPattern = /^\d+\.\d+\.\d+(-[\w.]+)?$/
    if (!semverPattern.test(tag)) {
      throw new Error(`Invalid release tag: ${tag}. Only semver tags are allowed for demo builds.`)
    }

    // Check if this is a prerelease
    const isPrerelease = tag.includes('-')

    core.info(`Building demos for ${isPrerelease ? 'prerelease' : 'stable release'}: ${tag}`)

    return {
      tag,
      is_prerelease: isPrerelease,
      action: releaseAction,
    }
  },
})
