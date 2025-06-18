import { z } from 'zod/v4'
import { getDemoConfig } from '../../src/lib/demos/index.ts'
import { CommonSchemas, defineWorkflowStep, GitHubContextSchema } from '../../src/lib/github-actions/index.ts'
import { VersionHistory } from '../../src/lib/version-history/index.ts'

// Input/Output schemas
const ExtractReleaseInfoInputs = z.object({
  tag: z.string().optional(),
  context: GitHubContextSchema,
})

const ExtractReleaseInfoOutputs = z.object({
  tag: z.string(),
  actual_tag: z.string(),
  is_prerelease: z.string(),
  is_dist_tag: z.string(),
  needs_build: z.string(),
  action: z.string(),
})

/**
 * Extract and validate release information
 */
export default defineWorkflowStep({
  name: 'extract-release-info',
  description: 'Extract and validate release information to determine demo build requirements',
  inputs: ExtractReleaseInfoInputs,
  outputs: ExtractReleaseInfoOutputs,

  async execute({ core, inputs }) {
    const { tag: inputTag, context } = inputs
    const isWorkflowDispatch = context.event_name === 'workflow_dispatch'

    // Get tag from event or manual input
    const tag = isWorkflowDispatch ? inputTag : (context.event as any).release?.tag_name
    if (!tag) {
      throw new Error('No tag provided')
    }

    // Get release info
    const isPrerelease = isWorkflowDispatch
      ? VersionHistory.isPrerelease(tag)
      : (context.event as any).release?.prerelease

    const action = isWorkflowDispatch ? 'manual' : (context.event as any).action

    // Handle dist-tag releases
    if (tag === 'next' || tag === 'latest') {
      let actualTag = tag
      let needsBuild = false

      if (tag === 'next' && action === 'edited') {
        try {
          const versionHistory = new VersionHistory()
          const distTag = await versionHistory.getDistTag('next')
          if (distTag?.semverTag) {
            actualTag = distTag.semverTag
            needsBuild = true
          }
        } catch (e) {
          core.error(`Error finding semver tag: ${e}`)
        }
      }

      return {
        tag,
        actual_tag: actualTag,
        is_prerelease: String(false),
        is_dist_tag: 'true',
        needs_build: String(needsBuild),
        action: action || 'unknown',
      }
    }

    // Regular semver release - check minimum version
    const config = getDemoConfig()
    const needsBuild = config.meetsMinimumPolenVersion(tag)

    if (!needsBuild) {
      core.warning(
        `Version ${tag} is below minimum Polen version ${config.minimumPolenVersion}`,
      )
    }

    return {
      tag,
      actual_tag: tag,
      is_prerelease: String(isPrerelease),
      is_dist_tag: 'false',
      needs_build: String(needsBuild),
      action: action || 'unknown',
    }
  },
})
