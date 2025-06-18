import { z } from 'zod/v4'
import { defineStep, GitHubContextSchema } from '../../src/lib/github-actions/index.ts'

const Inputs = z.object({
  context: GitHubContextSchema,
  previous: z.object({
    actual_tag: z.string(),
  }),
})

const Outputs = z.object({
  link_added: z.string(),
})

/**
 * Add demos link to commit status
 */
export default defineStep({
  name: 'add-demos-link',
  description: 'Add a GitHub commit status with link to the deployed demos',
  inputs: Inputs,
  outputs: Outputs,
  async run({ github, context, core, inputs }) {
    const { actual_tag } = inputs.previous
    const githubContext = inputs.context

    let sha: string
    if (githubContext.event_name === 'workflow_dispatch') {
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
      sha = (githubContext.event as any).release?.target_commitish || ''
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
