import { $ } from 'zx'

interface Version {
  sha: string
  shortSha: string
  tag: string
}

interface VersionHistory {
  latest: Version | null
  previous: Version[]
}

/**
 * Get version history from git tags
 * Returns the latest stable version and previous versions with their commit SHAs
 */
export async function getVersionHistory(cwd?: string): Promise<VersionHistory> {
  // Configure zx for this function
  const $$ = cwd ? $({ cwd, verbose: false }) : $

  // Get all tags sorted by version (newest first)
  const tagsOutput = await $$`git tag -l --sort=-version:refname`
  const allTags = tagsOutput.stdout.split('\n').filter(Boolean)

  // Filter to only semver tags
  const semverTags = allTags.filter(tag => /^[0-9]+\.[0-9]+\.[0-9]+/.test(tag))

  // Get version info with commit SHAs
  const versions: Version[] = []
  for (const tag of semverTags.slice(0, 20)) { // Limit to recent 20 versions
    try {
      const sha = (await $$`git rev-list -n 1 ${tag}`).stdout.trim()
      const shortSha = sha.substring(0, 7)
      versions.push({ sha, shortSha, tag })
    } catch (e) {
      // Skip if tag doesn't exist
    }
  }

  // Find latest stable version (no prerelease suffix)
  const latest = versions.find(v => !v.tag.includes('-')) || null

  // Get previous versions (excluding latest)
  const previous = versions
    .filter(v => v !== latest)
    .slice(0, 10)

  return {
    latest,
    previous,
  }
}
