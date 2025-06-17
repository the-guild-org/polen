import { type AddDemosLinkInputs, Step } from '../types.ts'

/**
 * Add a commit status with link to the deployed demos for this release
 *
 * WHAT: Creates a GitHub commit status pointing to the live demo deployment
 * WHY: Provides immediate access to demos from the commit/release page on GitHub
 *
 * When someone views a release or commit on GitHub, they'll see a "polen/demos"
 * status check with a direct link to the live demos for that version.
 *
 * Handles two scenarios:
 * 1. GitHub release events: Uses the commit SHA from the release
 * 2. Manual workflow dispatch: Looks up the commit SHA for the provided tag
 *
 * The commit status appears as:
 * - Context: "polen/demos"
 * - State: "success" (green checkmark)
 * - Description: "View demos for {version}"
 * - Link: https://org.github.io/polen/{version}/
 *
 * Gracefully handles edge cases like commits not in the default branch
 * (which can happen with release tags).
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
