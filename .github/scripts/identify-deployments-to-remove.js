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
 * @param {typeof import('fs').promises} params.fs
 * @param {typeof import('child_process').execSync} params.execSync
 */
module.exports = async ({ context, github, core, fs, execSync }) => {
  // Configuration
  const KEEP_RECENT_COMMITS = 15;
  const PR_RETENTION_DAYS = 7;
  const now = new Date();

  // Get all tags to identify releases
  const tags = execSync('git tag', { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);

  // Separate stable releases from pre-releases
  const stableReleases = tags.filter(tag => !tag.includes('-'));
  const preReleases = tags.filter(tag => tag.includes('-'));

  // Find the latest stable release
  const latestStable = stableReleases.sort().pop() || '';

  // Get pre-releases to keep (since last stable)
  const preReleasesToKeep = latestStable
    ? preReleases.filter(tag => tag > latestStable)
    : preReleases;

  console.log('Stable releases (keep forever):', stableReleases);
  console.log('Pre-releases to keep:', preReleasesToKeep);

  // Get commits for each tag
  const tagCommits = new Set();
  [...stableReleases, ...preReleasesToKeep].forEach(tag => {
    try {
      const commit = execSync(`git rev-list -n 1 ${tag}`, { encoding: 'utf-8' }).trim();
      tagCommits.add(commit);
    } catch (e) {
      console.log(`Warning: Could not get commit for tag ${tag}`);
    }
  });

  // Find deployments to remove
  const toRemove = {
    trunk: [],
    prs: []
  };

  // Check trunk deployments (direct SHA directories in root)
  const rootDirs = await fs.readdir('.');
  const shaDirs = rootDirs.filter(dir => /^[0-9a-f]{40}$/.test(dir));

  // Get recent commits on main branch
  const recentCommits = execSync(`git rev-list -n ${KEEP_RECENT_COMMITS + 50} origin/main`, { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean)
    .slice(0, KEEP_RECENT_COMMITS);

  for (const sha of shaDirs) {
    if (!tagCommits.has(sha) && !recentCommits.includes(sha)) {
      toRemove.trunk.push(sha);
    }
  }

  // Check PR deployments
  const prDirs = rootDirs.filter(dir => dir.startsWith('pr-'));

  for (const prDir of prDirs) {
    const prNumber = prDir.replace('pr-', '');

    // Check if PR is closed and how long ago
    try {
      const { data: pr } = await github.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: parseInt(prNumber)
      });

      if (pr.state === 'closed' && pr.closed_at) {
        const closedDate = new Date(pr.closed_at);
        const daysSinceClosed = (now.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceClosed > PR_RETENTION_DAYS) {
          toRemove.prs.push(prDir);
        }
      }
    } catch (e) {
      console.log(`Could not check PR ${prNumber}, may be deleted`);
      // If we can't find the PR, it's probably old and safe to remove
      toRemove.prs.push(prDir);
    }
  }

  console.log('Trunk deployments to remove:', toRemove.trunk);
  console.log('PR deployments to remove:', toRemove.prs);

  core.setOutput('toRemove', JSON.stringify(toRemove));
};

