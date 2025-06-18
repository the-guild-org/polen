import { z } from 'zod/v4'
import { GitHubActions } from '../../src/lib/github-actions/index.ts'
import { VersionHistory } from '../../src/lib/version-history/index.ts'

// Input/Output schemas
const ExtractReleaseInfoInputs = z.object({
  tag: z.string().optional(),
})

const ExtractReleaseInfoOutputs = z.object({
  tag: z.string(),
  actual_tag: z.string(),
  is_prerelease: z.string(),
  is_dist_tag: z.string(),
  needs_build: z.string(),
  action: z.string(),
})

// This step can handle both release and workflow_dispatch events
const Context = z.union([
  GitHubActions.ReleaseContext,
  GitHubActions.WorkflowDispatchContext,
])

/**
 * Extract and validate release information
 */
export default GitHubActions.createStep({
  name: 'extract-release-info',
  description: 'Extract and validate release information to determine demo build requirements',
  inputs: ExtractReleaseInfoInputs,
  outputs: ExtractReleaseInfoOutputs,
  context: Context,

  async run({ core, inputs, context }) {
    const { tag: inputTag } = inputs
    const isWorkflowDispatch = context.eventName === 'workflow_dispatch'

    // Get tag from event or manual input
    let tag: string | undefined
    if (isWorkflowDispatch) {
      tag = inputTag
    } else {
      tag = context.payload.release.tag_name
    }

    if (!tag) {
      throw new Error('No tag provided')
    }

    // Get release info
    const releaseAction = isWorkflowDispatch ? 'manual' : (context.payload as any).action

    // Track tags for debugging
    core.info(`Analyzing tag: ${tag}`)

    // Create version history and analyze dist tags
    const history = new VersionHistory()
    const distTagInfo = await history.getDistTag(tag)
    const isDistTag = distTagInfo !== null && distTagInfo.semverTag !== undefined
    const actualTag = isDistTag && distTagInfo.semverTag ? distTagInfo.semverTag : tag

    core.info(`Tag info: ${tag} -> ${actualTag} (isDistTag: ${isDistTag})`)

    // Get all version tags
    const versions = await history.getVersions()
    const allTags = new Set(versions.map(v => v.tag))

    // Check if this is a prerelease
    const isPrerelease = tag.includes('-') || tag.includes('alpha') || tag.includes('beta') || tag.includes('rc')

    // Determine if build is needed
    let needsBuild = 'true'

    if (releaseAction === 'deleted' || releaseAction === 'unpublished') {
      core.info('Release deleted/unpublished - no build needed')
      needsBuild = 'false'
    } else if (isDistTag) {
      core.info(`Dist tag update: ${tag} -> ${actualTag}`)
      needsBuild = 'false'
    } else if (!allTags.has(tag)) {
      core.info(`Tag ${tag} not found in version history - needs build`)
      needsBuild = 'true'
    } else {
      core.info(`Tag ${tag} found in version history`)
      needsBuild = 'true'
    }

    return {
      tag,
      actual_tag: actualTag,
      is_prerelease: String(isPrerelease),
      is_dist_tag: String(isDistTag),
      needs_build: needsBuild,
      action: releaseAction || 'unknown',
    }
  },
})
