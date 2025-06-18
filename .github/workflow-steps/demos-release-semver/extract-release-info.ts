import { getDemoConfig } from '../../../src/lib/demos/config.ts'
import { VersionHistory } from '../../../src/lib/version-history/index.ts'
import { type ReleaseInputs, Step } from '../types.ts'

/**
 * Extract and validate release information to determine demo build requirements
 *
 * WHAT: Parses GitHub release event data and validates if demos should be built
 * WHY: Not all releases need demos - filters by minimum version requirements and handles edge cases
 *
 * Handles multiple trigger scenarios:
 * 1. GitHub release events (published/edited) - Uses event metadata
 * 2. Manual workflow dispatch - Uses manual inputs
 * 3. Dist-tag releases ("latest", "next") - Special handling
 *
 * Key validations:
 * - Minimum Polen version check (demos only supported for recent versions)
 * - Dist-tag handling ("latest" never needs rebuild, "next" requires semver lookup)
 * - Release vs prerelease detection
 *
 * Outputs:
 * - needs_build: Whether demos should be built for this release
 * - actual_tag: The semver tag to use (may differ from input for dist-tags)
 * - is_dist_tag: Whether this is a dist-tag rather than semver release
 * - is_prerelease: Whether this is a prerelease version
 *
 * This gating step prevents unnecessary builds for old versions or edge cases
 * while ensuring valid releases get proper demo deployments.
 */
export default Step<ReleaseInputs>(async ({ core, inputs }) => {
  try {
    // Get inputs
    const eventName = inputs.github_event_name
    const isWorkflowDispatch = eventName === 'workflow_dispatch'

    // Get tag from event or manual input
    const tag = isWorkflowDispatch
      ? inputs.input_tag
      : inputs.github_release_tag_name

    if (!tag) {
      core.setFailed('No tag provided')
      return
    }

    // Get release info from event
    const isPrerelease = isWorkflowDispatch
      ? VersionHistory.isPrerelease(tag)
      : inputs.github_release_prerelease

    const action = isWorkflowDispatch
      ? 'manual'
      : inputs.github_event_action

    // Output basic info
    core.setOutput('tag', tag)
    core.setOutput('is_prerelease', isPrerelease?.toString())
    core.setOutput('action', action)

    // Handle dist-tag releases (next, latest)
    if (tag === 'next' || tag === 'latest') {
      core.setOutput('is_dist_tag', 'true')

      if (tag === 'latest') {
        core.setOutput('needs_build', 'false')
        return
      }

      // For "next" tag being edited, find the actual semver
      if (tag === 'next' && action === 'edited') {
        try {
          const versionHistory = new VersionHistory()
          const distTag = await versionHistory.getDistTag('next')

          if (distTag?.semverTag) {
            core.setOutput('actual_tag', distTag.semverTag)
            core.setOutput('needs_build', 'true')
          } else {
            core.warning('No semver tag found for next release')
            core.setOutput('needs_build', 'false')
          }
        } catch (e) {
          core.error(`Error finding semver tag: ${(e as Error).message}`)
          core.setOutput('needs_build', 'false')
        }
      } else {
        core.setOutput('needs_build', 'false')
      }

      return
    }

    // Regular semver release
    core.setOutput('is_dist_tag', 'false')
    core.setOutput('actual_tag', tag)

    // Check minimum Polen version
    try {
      const config = getDemoConfig()

      if (config.meetsMinimumPolenVersion(tag)) {
        core.info(
          `✅ Version ${tag} meets minimum requirement (${config.minimumPolenVersion})`,
        )
        core.setOutput('needs_build', 'true')
      } else {
        core.warning(
          `Version ${tag} is below minimum Polen version ${config.minimumPolenVersion}. `
            + `Demos are only supported for Polen versions ${config.minimumPolenVersion} and above`,
        )
        core.setOutput('needs_build', 'false')
      }
    } catch (e) {
      core.error(`Error checking minimum Polen version: ${(e as Error).message}`)
      // Default to building if we can't check
      core.setOutput('needs_build', 'true')
    }
  } catch (error) {
    core.setFailed(`Failed to extract release info: ${(error as Error).message}`)
  }
})
