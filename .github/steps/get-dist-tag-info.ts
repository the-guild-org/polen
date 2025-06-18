import { z } from 'zod/v4'
import { defineWorkflowStep } from '../../src/lib/github-actions/index.ts'
import { VersionHistory } from '../../src/lib/version-history/index.ts'

const GetDistTagInfoInputs = z.object({
  github_event_name: z.string(),
  input_dist_tag: z.string().optional(),
  github_ref: z.string().optional(),
})

const GetDistTagInfoOutputs = z.object({
  tag_name: z.string(),
  semver_tag: z.string(),
  commit: z.string(),
})

/**
 * Extract dist-tag information and find corresponding semver version
 */
export default defineWorkflowStep({
  name: 'get-dist-tag-info',
  description: 'Resolve npm dist-tags to their actual semver versions',
  inputs: GetDistTagInfoInputs,
  outputs: GetDistTagInfoOutputs,

  async execute({ core, inputs }) {
    const { github_event_name, input_dist_tag, github_ref } = inputs
    const versionHistory = new VersionHistory()

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
