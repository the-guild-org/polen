import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'
import { GitHubActions } from '../../../src/lib/github-actions/index.ts'

const Inputs = z.object({
  dist_tag: z.string().optional(),
})

const Outputs = z.object({
  tag_name: z.string(),
  semver_tag: z.string(),
  commit: z.string(),
})

// This step can handle both push (to tags) and workflow_dispatch events
const DistTagContext = z.union([
  GitHubActions.PushContext,
  GitHubActions.WorkflowDispatchContext,
])

/**
 * Extract dist-tag information and find corresponding semver version
 */
export default GitHubActions.createStep({
  description: 'Resolve npm dist-tags to their actual semver versions',
  inputs: Inputs,
  outputs: Outputs,
  context: DistTagContext,
  async run({ core, inputs, context }) {
    const { dist_tag } = inputs

    // Get the tag name from push event or manual input
    let tagName: string
    if (context.eventName === 'workflow_dispatch') {
      if (!dist_tag) {
        throw new Error('dist_tag input is required for workflow_dispatch')
      }
      tagName = dist_tag
    } else {
      // Push event
      const { payload } = context
      if (!payload.ref || !payload.ref.startsWith('refs/tags/')) {
        throw new Error('Invalid ref for tag push event')
      }
      tagName = payload.ref.replace('refs/tags/', '')
    }

    // Get the dist tag info
    const distTag = await VersionHistory.getDistTag(tagName)
    if (!distTag) {
      throw new Error(`Tag ${tagName} not found`)
    }

    // Find the semver tag for this commit
    if (!distTag.semverTag) {
      throw new Error(`No semver tag found for commit ${distTag.commit}`)
    }

    core.info(`✅ Dist-tag ${tagName} points to ${distTag.semverTag}`)

    return {
      tag_name: tagName,
      semver_tag: distTag.semverTag,
      commit: distTag.commit,
    }
  },
})
