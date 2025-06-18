import { z } from 'zod/v4'
import { defineWorkflowStep } from '../../src/lib/github-actions/index.ts'

const AddDemosLinkInputs = z.object({
  actual_tag: z.string(),
  github_event_name: z.string(),
  github_release_target_commitish: z.string().optional(),
})

const AddDemosLinkOutputs = z.object({
  link_added: z.string(),
})

/**
 * Add demos link to commit status
 */
export default defineWorkflowStep({
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
          `Could not add commit status: commit ${sha} not found in repository. `
            + `This is expected for tags on commits not in the default branch`,
        )
        return { link_added: 'false' }
      } else {
        throw error
      }
    }
  },
})
