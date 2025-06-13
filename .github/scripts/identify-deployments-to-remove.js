// @ts-check
/**
 * @param {import('./async-function').AsyncFunctionArguments & { semver: typeof import('semver') }} args
 */
export default async ({ github, context, core, exec, semver }) => {
  // Import required modules
  const fs = require("fs").promises;

  // Configuration
  const KEEP_RECENT_COMMITS = 15;
  const PR_RETENTION_DAYS = 7;
  const now = new Date();

  // Get all tags to identify releases
  let tagsOutput = '';
  await exec.exec('git', ['tag'], {
    listeners: {
      stdout: (data) => {
        tagsOutput += data.toString();
      }
    }
  });
  const tags = tagsOutput
    .split("\n")
    .filter(Boolean)
    .filter((tag) => semver.valid(tag)); // Only keep valid semver tags

  // Separate stable releases from pre-releases
  const stableReleases = tags.filter((tag) => !tag.includes("-"));
  const preReleases = tags.filter((tag) => tag.includes("-"));

  // Find the latest stable release using proper semver comparison
  const latestStable =
    stableReleases.length > 0 ? stableReleases.sort(semver.compare).pop() : "";

  // Get pre-releases to keep (since last stable) using semver comparison
  const preReleasesToKeep = latestStable
    ? preReleases.filter((tag) => semver.gt(tag, latestStable))
    : preReleases;

  console.log("Stable releases (keep forever):", stableReleases);
  console.log("Pre-releases to keep:", preReleasesToKeep);

  // Get commits for each tag
  const tagCommits = new Set();
  [...stableReleases, ...preReleasesToKeep].forEach((tag) => {
    try {
      let commitOutput = '';
      await exec.exec('git', ['rev-list', '-n', '1', tag], {
        listeners: {
          stdout: (data) => {
            commitOutput += data.toString();
          }
        }
      });
      const commit = commitOutput.trim();
      tagCommits.add(commit);
    } catch (e) {
      console.log(`Warning: Could not get commit for tag ${tag}`);
    }
  });

  // Find deployments to remove
  const toRemove = {
    trunk: [],
    prs: [],
  };

  // Check trunk deployments (direct SHA directories in root)
  const rootDirs = await fs.readdir(".");
  const shaDirs = rootDirs.filter((dir) => /^[0-9a-f]{40}$/.test(dir));

  // Get recent commits on main branch
  let recentCommitsOutput = '';
  await exec.exec('git', ['rev-list', '-n', String(KEEP_RECENT_COMMITS + 50), 'origin/main'], {
    listeners: {
      stdout: (data) => {
        recentCommitsOutput += data.toString();
      }
    }
  });
  const recentCommits = recentCommitsOutput
    .split("\n")
    .filter(Boolean)
    .slice(0, KEEP_RECENT_COMMITS);

  for (const sha of shaDirs) {
    if (!tagCommits.has(sha) && !recentCommits.includes(sha)) {
      toRemove.trunk.push(sha);
    }
  }

  // Check PR deployments
  const prDirs = rootDirs.filter((dir) => dir.startsWith("pr-"));

  for (const prDir of prDirs) {
    const prNumber = prDir.replace("pr-", "");

    // Check if PR is closed and how long ago
    try {
      const { data: pr } = await github.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: parseInt(prNumber),
      });

      if (pr.state === "closed" && pr.closed_at) {
        const closedDate = new Date(pr.closed_at);
        const daysSinceClosed =
          (now.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24);

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

  console.log("Trunk deployments to remove:", toRemove.trunk);
  console.log("PR deployments to remove:", toRemove.prs);

  core.setOutput("toRemove", JSON.stringify(toRemove));
};
