// @ts-check
import * as fs from "node:fs/promises";
import * as semver from "semver";

/**
 * @param {import('../async-function').AsyncFunctionArguments} args
 */
export default async ({ core, exec }) => {
  // Configuration
  // Note: We no longer need KEEP_RECENT_COMMITS since we only deploy on releases

  // Get all tags to identify releases
  let tagsOutput = "";
  await exec.exec("git", ["tag"], {
    listeners: {
      stdout: (data) => {
        tagsOutput += data.toString();
      },
    },
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

  // Find what the dist-tags point to
  const distTagVersions = new Set();

  for (const distTag of ["latest", "next"]) {
    let tagOutput = "";
    try {
      await exec.exec("git", ["tag", "--points-at", distTag], {
        listeners: {
          stdout: (data) => {
            tagOutput += data.toString();
          },
        },
      });

      const versions = tagOutput
        .split("\n")
        .filter(Boolean)
        .filter((tag) => semver.valid(tag));

      versions.forEach((v) => distTagVersions.add(v));
    } catch (e) {
      console.log(`No "${distTag}" tag found`);
    }
  }

  // Find what the "next" tag points to (pre-release version)
  const nextVersion = Array.from(distTagVersions).find((v) => v.includes("-"));

  console.log("Latest stable release:", latestStable);
  console.log("Next version:", nextVersion);

  // Determine which pre-releases to keep
  let preReleasesToKeep = [];

  if (nextVersion) {
    // Keep all pre-releases that belong to the same major.minor.patch as next
    const nextBase =
      semver.major(nextVersion) +
      "." +
      semver.minor(nextVersion) +
      "." +
      semver.patch(nextVersion);
    preReleasesToKeep = preReleases.filter((tag) => {
      const tagBase =
        semver.major(tag) + "." + semver.minor(tag) + "." + semver.patch(tag);
      return tagBase === nextBase;
    });
  } else if (latestStable) {
    // Fallback: keep pre-releases newer than latest stable
    preReleasesToKeep = preReleases.filter((tag) =>
      semver.gt(tag, latestStable),
    );
  } else {
    // No stable release yet, keep all pre-releases
    preReleasesToKeep = preReleases;
  }

  console.log("Stable releases (keep forever):", stableReleases);
  console.log("Pre-releases to keep (next range):", preReleasesToKeep);
  console.log("Dist-tag versions (keep forever):", Array.from(distTagVersions));

  // Get commits for each tag
  const tagCommits = new Set();
  for (const tag of [...stableReleases, ...preReleasesToKeep]) {
    try {
      let commitOutput = "";
      await exec.exec("git", ["rev-list", "-n", "1", tag], {
        listeners: {
          stdout: (data) => {
            commitOutput += data.toString();
          },
        },
      });
      const commit = commitOutput.trim();
      tagCommits.add(commit);
    } catch (e) {
      console.log(`Warning: Could not get commit for tag ${tag}`);
    }
  }

  // Find deployments to remove
  const toRemove = {
    trunk: [],
  };

  // Check trunk deployments (semver directories in root)
  const rootDirs = await fs.readdir(".");
  const semverDirs = rootDirs.filter((dir) =>
    /^[0-9]+\.[0-9]+\.[0-9]+/.test(dir),
  );

  // Note: We no longer need to track recent commits since we only deploy on releases

  // For semver deployments, we keep based on the tag policy
  for (const dir of semverDirs) {
    // Check if this version should be kept
    const isStableRelease = stableReleases.includes(dir);
    const isKeptPrerelease = preReleasesToKeep.includes(dir);
    const isDistTagVersion = distTagVersions.has(dir);

    if (!isStableRelease && !isKeptPrerelease && !isDistTagVersion) {
      toRemove.trunk.push(dir);
    }
  }

  console.log("Trunk deployments to remove:", toRemove.trunk);

  core.setOutput("toRemove", JSON.stringify(toRemove));
};
