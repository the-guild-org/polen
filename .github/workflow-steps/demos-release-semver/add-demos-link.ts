import { type AddDemosLinkInputs, Step } from '../types.ts'

/**
 * Add demos link to commit
 */
export default Step<AddDemosLinkInputs>(async ({ github, context, core, inputs }) => {
  core.startGroup('Add demos link to commit')
  const tag = inputs.actual_tag
  const eventName = inputs.github_event_name

  let sha: string
  if (eventName === 'workflow_dispatch') {
    // For manual runs, get the commit SHA for the tag
    try {
      const { data: ref } = await github.rest.git.getRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: `tags/${tag}`,
      })
      sha = ref.object.sha
    } catch (e) {
      core.warning(`Could not find tag ${tag}: ${(e as Error).message}`)
      return
    }
  } else {
    sha = inputs.github_release_target_commitish || ''
    if (!sha) {
      core.warning('No target commitish provided')
      return
    }
  }

  // Try to create a commit status
  try {
    await github.rest.repos.createCommitStatus({
      owner: context.repo.owner,
      repo: context.repo.repo,
      sha: sha,
      state: 'success',
      target_url: `https://${context.repo.owner}.github.io/polen/${tag}/`,
      description: `View demos for ${tag}`,
      context: 'polen/demos',
    })
    core.info(`✅ Successfully added demos link to commit ${sha}`)
    core.endGroup()
  } catch (error: any) {
    if (error.status === 422) {
      core.warning(
        `Could not add commit status: commit ${sha} not found in repository. `
          + `This is expected for tags on commits not in the default branch`,
      )
      core.endGroup()
    } else {
      core.endGroup()
      throw error
    }
  }
})
