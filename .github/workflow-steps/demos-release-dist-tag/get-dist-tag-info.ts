import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { Step } from '../types.ts'

interface Inputs {
  github_event_name: string
  input_dist_tag?: string
  github_ref?: string
}

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
