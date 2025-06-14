import { $ } from 'zx'

interface DistTags {
  [key: string]: string | undefined
}

/**
 * Get dist-tag information from git tags
 * Returns which semver versions the dist-tags point to
 */
export async function getDistTags(cwd?: string): Promise<DistTags> {
  const distTags: DistTags = {}
  const distTagNames = ['latest', 'next']

  // Configure zx for this function
  const $$ = cwd ? $({ cwd, verbose: false }) : $

  for (const tag of distTagNames) {
    try {
      // Get the commit that this dist-tag points to
      const tagCommit = (await $$`git rev-list -n 1 ${tag}`).stdout.trim()

      // Find all tags at this commit
      const tagsAtCommit = (await $$`git tag --points-at ${tagCommit}`)
        .stdout
        .split('\n')
        .filter(t => t.trim())

      // Find the semver tag
      const semverTag = tagsAtCommit.find(t => /^[0-9]+\.[0-9]+\.[0-9]+/.test(t))

      if (semverTag) {
        distTags[tag] = semverTag
      }
    } catch {
      // Tag doesn't exist or other error - silently continue
    }
  }

  return distTags
}
