import { readFileSync } from 'node:fs'
import { parse as semverParse, prerelease as semverPrerelease, gte as semverGte } from '@vltpkg/semver'
import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { type ReleaseInputs, Step } from '../types.ts'

/**
 * Extract release information and determine if demos should be built
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
      ? (semverPrerelease(tag) !== undefined && semverPrerelease(tag)!.length > 0)
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
            console.log('❌ No semver tag found for next release')
            core.setOutput('needs_build', 'false')
          }
        } catch (e) {
          console.error('Error finding semver tag:', (e as Error).message)
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

    // Check minimum version
    try {
      const demoConfig = JSON.parse(
        readFileSync('.github/demo-config.json', 'utf-8'),
      )
      const minVersion = demoConfig.minimumVersion || '0.0.0'

      const tagVersion = semverParse(tag)
      const minVersionParsed = semverParse(minVersion)
      
      if (tagVersion && minVersionParsed && semverGte(tagVersion, minVersionParsed)) {
        console.log(
          `✅ Version ${tag} meets minimum requirement (${minVersion})`,
        )
        core.setOutput('needs_build', 'true')
      } else {
        console.log(
          `❌ Version ${tag} is below minimum demo version ${minVersion}`,
        )
        console.log(
          `⚠️  Demos are only supported for versions ${minVersion} and above`,
        )
        core.setOutput('needs_build', 'false')
      }
    } catch (e) {
      console.error('Error checking minimum version:', (e as Error).message)
      // Default to building if we can't check
      core.setOutput('needs_build', 'true')
    }
  } catch (error) {
    core.setFailed(`Failed to extract release info: ${(error as Error).message}`)
  }
})
