// @ts-check

/**
 * @typedef {import('@actions/github').context} GitHubContext
 * @typedef {import('@actions/core')} ActionsCore
 * @typedef {ReturnType<import('@actions/github').getOctokit>} GitHub
 */

/**
 * @param {Object} params
 * @param {GitHubContext} params.context
 * @param {GitHub} params.github
 * @param {ActionsCore} params.core
 * @param {string} params.prNumber
 * @param {string} params.currentSha
 */
module.exports = async ({ context, github, core, prNumber, currentSha }) => {
  const repoOwner = context.repo.owner;
  const repoName = context.repo.repo;

  try {
    // Get the gh-pages branch tree
    const { data: tree } = await github.rest.git.getTree({
      owner: repoOwner,
      repo: repoName,
      tree_sha: 'gh-pages'
      // Omit recursive to get only top-level items
    });

    // Find the PR directory
    const prDir = tree.tree.find(item => item.path === `pr-${prNumber}`);
    if (!prDir || prDir.type !== 'tree') {
      core.setOutput('deployment_links', '(none)');
      return;
    }

    // Get contents of PR directory
    const { data: prTree } = await github.rest.git.getTree({
      owner: repoOwner,
      repo: repoName,
      tree_sha: prDir.sha
      // Omit recursive to get only direct children
    });

    // Filter for commit SHA directories (excluding current)
    const commitDirs = prTree.tree
      .filter(item =>
        item.type === 'tree' &&
        /^[0-9a-f]{7,40}$/.test(item.path) &&
        item.path !== currentSha
      )
      .map(item => item.path)
      .sort()
      .reverse();

    if (commitDirs.length === 0) {
      core.setOutput('deployment_links', '(none)');
      return;
    }

    // Format as markdown links
    const links = commitDirs.map(sha => {
      const shortSha = sha.substring(0, 7);
      return `[\`${shortSha}\`](https://${repoOwner}.github.io/${repoName}/pr-${prNumber}/${sha}/pokemon/)`;
    });

    core.setOutput('deployment_links', links.join(' / '));
  } catch (error) {
    console.log('Error fetching previous deployments:', error.message);
    core.setOutput('deployment_links', '(none)');
  }
};
