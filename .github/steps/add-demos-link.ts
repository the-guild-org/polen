import { z } from 'zod/v4'
import { GitHubActions } from '../../src/lib/github-actions/index.ts'

const Inputs = z.object({
  previous: z.object({
    actual_tag: z.string(),
  }),
})

const Outputs = z.object({
  link_added: z.boolean(),
})

// This step can handle both release and workflow_dispatch events
const Context = z.union([
  GitHubActions.ReleaseContext,
  GitHubActions.WorkflowDispatchContext,
])

/**
 * Add demos link to commit status
 */
export default GitHubActions.createStep({
  description: 'Add a GitHub commit status with link to the deployed demos',
  inputs: Inputs,
  outputs: Outputs,
  context: Context,
  async run({ github, context, core, inputs }) {
    const { actual_tag } = inputs.previous

    let sha: string
    if (context.eventName === 'workflow_dispatch') {
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
        return { link_added: false }
      }
    } else {
      // For release events
      const releasePayload = context.payload as z.infer<typeof GitHubActions.ReleaseContext>['payload']
      sha = releasePayload.release.target_commitish
      if (!sha) {
        core.warning('No target commitish provided')
        return { link_added: false }
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
      return { link_added: true }
    } catch (error: any) {
      if (error.status === 422) {
        core.warning(
          `Could not add commit status: commit ${sha} not found in repository. `
            + `This is expected for tags on commits not in the default branch`,
        )
        return { link_added: false }
      } else {
        throw error
      }
    }
  },
})
