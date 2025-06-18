import { z } from 'zod/v4'
import { defineStep, PushContext, WorkflowDispatchContext } from '../../src/lib/github-actions/index.ts'
import { VersionHistory } from '../../src/lib/version-history/index.ts'

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
  PushContext,
  WorkflowDispatchContext,
])

/**
 * Extract dist-tag information and find corresponding semver version
 */
export default defineStep({
  name: 'get-dist-tag-info',
  description: 'Resolve npm dist-tags to their actual semver versions',
  inputs: Inputs,
  outputs: Outputs,
  context: DistTagContext,
  async run({ core, inputs, context }) {
    const { dist_tag } = inputs
    const versionHistory = new VersionHistory()

    // Get the tag name from push event or manual input
    let tagName: string
    if (context.eventName === 'workflow_dispatch') {
      if (!dist_tag) {
        throw new Error('dist_tag input is required for workflow_dispatch')
      }
      tagName = dist_tag
    } else {
      // Push event
      const pushPayload = context.payload as z.infer<typeof PushContext>['payload']
      if (!pushPayload.ref || !pushPayload.ref.startsWith('refs/tags/')) {
        throw new Error('Invalid ref for tag push event')
      }
      tagName = pushPayload.ref.replace('refs/tags/', '')
    }

    // Get the dist tag info
    const distTag = await versionHistory.getDistTag(tagName)
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
