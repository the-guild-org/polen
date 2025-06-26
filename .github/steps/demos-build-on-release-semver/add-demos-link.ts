import { GitHubActions } from '#lib/github-actions/index'
import { z } from 'zod/v4'

const Inputs = z.object({
  previous: z.object({
    tag: z.string(),
    is_prerelease: z.boolean(),
    action: z.string(),
  }),
})

const Outputs = z.object({
  link_added: z.boolean(),
})

const Context = GitHubActions.ReleaseContext

/**
 * Add demos link to commit status
 */
export default GitHubActions.createStep({
  description: `Add a GitHub commit status with link to the deployed demos`,
  inputs: Inputs,
  outputs: Outputs,
  context: Context,
  async run({ github, context, core, inputs }) {
    const { tag } = inputs.previous

    let sha: string
    // For release events
    const releasePayload = context.payload
    sha = releasePayload.release.target_commitish
    if (!sha) {
      core.warning(`No target commitish provided`)
      return { link_added: false }
    }

    // Create commit status
    try {
      await github.rest.repos.createCommitStatus({
        owner: context.repo.owner,
        repo: context.repo.repo,
        sha: sha,
        state: `success`,
        target_url: `https://${context.repo.owner}.github.io/polen/${tag}/`,
        description: `View demos for ${tag}`,
        context: `polen/demos`,
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
