/**
 * Unified workflow steps for dist-tag operations
 */

import { z } from 'zod'
import { defineWorkflowStep } from '../../../../src/lib/github-actions/index.js'
import { demoOrchestrator } from '../orchestrator.ts'
import { VersionHistory } from '../../../../src/lib/version-history/index.js'

// Input/Output schemas
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

const UpdateDistTagContentInputs = z.object({
  tag_name: z.string(),
  semver_tag: z.string(),
})

const UpdateDistTagContentOutputs = z.object({
  update_complete: z.string(),
})

/**
 * Extract dist-tag information and find corresponding semver version
 */
export const getDistTagInfo = defineWorkflowStep({
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

/**
 * Update dist-tag content by copying from semver deployment
 */
export const updateDistTagContent = defineWorkflowStep({
  name: 'update-dist-tag-content',
  description: 'Copy content from semver deployment to dist-tag directory',
  inputs: UpdateDistTagContentInputs,
  outputs: UpdateDistTagContentOutputs,
  
  async execute({ core, inputs }) {
    const { tag_name, semver_tag } = inputs

    await demoOrchestrator.updateDistTag(tag_name, semver_tag)

    return {
      update_complete: 'true',
    }
  },
})