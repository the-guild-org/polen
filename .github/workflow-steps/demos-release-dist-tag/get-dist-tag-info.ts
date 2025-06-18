import { VersionHistory } from '../../../src/lib/version-history/index.ts'
import { Step } from '../types.ts'

interface Inputs {
  github_event_name: string
  input_dist_tag?: string
  github_ref?: string
}

/**
 * Extract dist-tag information and find corresponding semver version
 *
 * WHAT: Resolves npm dist-tags (like "latest", "next") to their actual semver versions
 * WHY: Dist-tag releases need to copy content from existing semver deployments rather than rebuild
 *
 * Handles two trigger scenarios:
 * 1. Tag push event: Extracts tag from refs/tags/{tag_name}
 * 2. Manual dispatch: Uses input_dist_tag parameter
 *
 * Outputs:
 * - tag_name: The dist-tag name (e.g., "latest")
 * - semver_tag: The actual semver version it points to (e.g., "1.2.3")
 * - commit: The git commit SHA
 *
 * This enables the deployment to copy demos from the semver deployment
 * instead of rebuilding them from source.
 */
export default Step<Inputs>(async ({ core, inputs }) => {
  const { github_event_name, input_dist_tag, github_ref } = inputs
  const versionHistory = new VersionHistory()

  try {
    // Get the tag name from push event or manual input
    let tagName: string
    if (github_event_name === 'workflow_dispatch') {
      if (!input_dist_tag) {
        throw new Error('dist_tag input is required for workflow_dispatch')
      }
      tagName = input_dist_tag
    } else {
      if (!github_ref || !github_ref.startsWith('refs/tags/')) {
        throw new Error('Invalid ref for tag push event')
      }
      tagName = github_ref.replace('refs/tags/', '')
    }

    core.setOutput('tag_name', tagName)

    // Get the dist tag info
    const distTag = await versionHistory.getDistTag(tagName)
    if (!distTag) {
      throw new Error(`Tag ${tagName} not found`)
    }

    core.setOutput('commit', distTag.commit)

    // Find the semver tag for this commit
    if (!distTag.semverTag) {
      throw new Error(`No semver tag found for commit ${distTag.commit}`)
    }

    core.setOutput('semver_tag', distTag.semverTag)
    core.info(`✅ Dist-tag ${tagName} points to ${distTag.semverTag}`)
  } catch (error) {
    core.setFailed(`Failed to get dist-tag info: ${error}`)
  }
})
