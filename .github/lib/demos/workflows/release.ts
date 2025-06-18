/**
 * Unified workflow steps for demo releases
 */

import { z } from 'zod'
import { defineWorkflowStep, CommonSchemas } from '../../../../src/lib/github-actions/index.js'
import { demoOrchestrator } from '../orchestrator.ts'
import { demoConfig } from '../config.ts'
import { VersionHistory } from '../../../../src/lib/version-history/index.js'

// Input/Output schemas
const ExtractReleaseInfoInputs = z.object({
  github_event_name: z.string(),
  input_tag: z.string().optional(),
  github_release_tag_name: z.string().optional(),
  github_release_prerelease: CommonSchemas.boolean.optional(),
  github_event_action: z.string().optional(),
})

const ExtractReleaseInfoOutputs = z.object({
  tag: z.string(),
  actual_tag: z.string(),
  is_prerelease: z.string(),
  is_dist_tag: z.string(),
  needs_build: z.string(),
  action: z.string(),
})

const BuildDemosInputs = z.object({
  tag: z.string(),
  actual_tag: z.string().optional(),
})

const BuildDemosOutputs = z.object({
  build_complete: z.string(),
})

const AddDemosLinkInputs = z.object({
  actual_tag: z.string(),
  github_event_name: z.string(),
  github_release_target_commitish: z.string().optional(),
})

const AddDemosLinkOutputs = z.object({
  link_added: z.string(),
})

/**
 * Extract and validate release information
 */
export const extractReleaseInfo = defineWorkflowStep({
  name: 'extract-release-info',
  description: 'Extract and validate release information to determine demo build requirements',
  inputs: ExtractReleaseInfoInputs,
  outputs: ExtractReleaseInfoOutputs,
  
  async execute({ core, inputs }) {
    const { github_event_name, input_tag, github_release_tag_name, github_release_prerelease, github_event_action } = inputs
    const isWorkflowDispatch = github_event_name === 'workflow_dispatch'

    // Get tag from event or manual input
    const tag = isWorkflowDispatch ? input_tag : github_release_tag_name
    if (!tag) {
      throw new Error('No tag provided')
    }

    // Get release info
    const isPrerelease = isWorkflowDispatch 
      ? VersionHistory.isPrerelease(tag)
      : github_release_prerelease
    
    const action = isWorkflowDispatch ? 'manual' : github_event_action

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
    const config = demoConfig.getConfig()
    const needsBuild = demoConfig.meetsMinimumVersion(tag)
    
    if (!needsBuild) {
      core.warning(
        `Version ${tag} is below minimum Polen version ${config.examples.minimumPolenVersion}`
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

/**
 * Build demos for a release
 */
export const buildDemos = defineWorkflowStep({
  name: 'build-demos',
  description: 'Build demo sites for a newly released Polen version',
  inputs: BuildDemosInputs,
  outputs: BuildDemosOutputs,
  
  async execute({ core, inputs }) {
    const tag = inputs.actual_tag || inputs.tag
    
    const result = await demoOrchestrator.buildForRelease(tag)
    
    if (!result.success) {
      const errorMessages = result.errors.map(e => e.message).join(', ')
      throw new Error(`Failed to build demos: ${errorMessages}`)
    }

    return {
      build_complete: 'true',
    }
  },
})

/**
 * Add demos link to commit status
 */
export const addDemosLink = defineWorkflowStep({
  name: 'add-demos-link',
  description: 'Add a GitHub commit status with link to the deployed demos',
  inputs: AddDemosLinkInputs,
  outputs: AddDemosLinkOutputs,
  
  async execute({ github, context, core, inputs }) {
    const { actual_tag, github_event_name, github_release_target_commitish } = inputs

    let sha: string
    if (github_event_name === 'workflow_dispatch') {
      // Get commit SHA for the tag
      try {
        const { data: ref } = await github.rest.git.getRef({
          owner: context.repo.owner,
          repo: context.repo.repo,
          ref: `tags/${actual_tag}`,
        })
        sha = ref.object.sha
      } catch (e) {
        core.warning(`Could not find tag ${actual_tag}: ${e}`)
        return { link_added: 'false' }
      }
    } else {
      sha = github_release_target_commitish || ''
      if (!sha) {
        core.warning('No target commitish provided')
        return { link_added: 'false' }
      }
    }

    // Create commit status
    try {
      await github.rest.repos.createCommitStatus({
        owner: context.repo.owner,
        repo: context.repo.repo,
        sha: sha,
        state: 'success',
        target_url: `https://${context.repo.owner}.github.io/polen/${actual_tag}/`,
        description: `View demos for ${actual_tag}`,
        context: 'polen/demos',
      })
      
      core.info(`✅ Successfully added demos link to commit ${sha}`)
      return { link_added: 'true' }
    } catch (error: any) {
      if (error.status === 422) {
        core.warning(
          `Could not add commit status: commit ${sha} not found in repository. ` +
          `This is expected for tags on commits not in the default branch`
        )
        return { link_added: 'false' }
      } else {
        throw error
      }
    }
  },
})