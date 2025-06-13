// @ts-check
/** @param {import('./async-function').AsyncFunctionArguments} AsyncFunctionArguments */
export default async ({ github, context, core }) => {
  // Get inputs from environment variables
  const prNumber = process.env.PR_NUMBER
  const currentSha = process.env.CURRENT_SHA

  const repoOwner = context.repo.owner
  const repoName = context.repo.repo

  try {
    // Get the gh-pages branch tree
    const { data: tree } = await github.rest.git.getTree({
      owner: repoOwner,
      repo: repoName,
      tree_sha: 'gh-pages',
      // Omit recursive to get only top-level items
    })

    // Find the PR directory
    const prDir = tree.tree.find((item) => item.path === `pr-${prNumber}`)
    if (!prDir || prDir.type !== 'tree') {
      core.setOutput('deployment_links', '(none)')
      return
    }

    // Get contents of PR directory
    const { data: prTree } = await github.rest.git.getTree({
      owner: repoOwner,
      repo: repoName,
      tree_sha: prDir.sha,
      // Omit recursive to get only direct children
    })

    // Filter for commit SHA directories (excluding current)
    const commitDirs = prTree.tree
      .filter(
        (item) =>
          item.type === 'tree'
          && /^[0-9a-f]{7,40}$/.test(item.path)
          && item.path !== currentSha,
      )
      .map((item) => item.path)
      .sort()
      .reverse()

    if (commitDirs.length === 0) {
      core.setOutput('deployment_links', '(none)')
      return
    }

    // Format as markdown links
    const links = commitDirs.map((sha) => {
      const shortSha = sha.substring(0, 7)
      return `[\`${shortSha}\`](https://${repoOwner}.github.io/${repoName}/pr-${prNumber}/${sha}/pokemon/)`
    })

    core.setOutput('deployment_links', links.join(' / '))
  } catch (error) {
    console.log('Error fetching previous deployments:', error.message)
    core.setOutput('deployment_links', '(none)')
  }
}
