// @ts-check

/**
 * Add demos link to commit
 *
 * @param {import('../../scripts/lib/async-function').AsyncFunctionArguments} args
 */
export default async ({ github, context }) => {
  const tag = process.env.ACTUAL_TAG
  const eventName = process.env.GITHUB_EVENT_NAME

  let sha
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
      console.log(`Could not find tag ${tag}: ${e.message}`)
      return
    }
  } else {
    sha = process.env.GITHUB_RELEASE_TARGET_COMMITISH
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
    console.log(`✅ Successfully added demos link to commit ${sha}`)
  } catch (error) {
    if (error.status === 422) {
      console.log(
        `⚠️ Could not add commit status: commit ${sha} not found in repository`,
      )
      console.log(
        `📝 This is expected for tags on commits not in the default branch`,
      )
    } else {
      throw error
    }
  }
}
