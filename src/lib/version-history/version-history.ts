import {
  compare as semverCompare,
  parse as semverParse,
  prerelease as semverPrerelease,
  type Version as SemverVersion,
} from '@vltpkg/semver'
import { type SimpleGit, simpleGit } from 'simple-git'
import type { DevelopmentCycle, DistTagInfo, Version, VersionCatalog } from './types.ts'

export type { DevelopmentCycle, DistTagInfo, Version, VersionCatalog } from './types.ts'

// Helper to get git instance
function getGit(repoPath: string = process.cwd()): SimpleGit {
  return simpleGit(repoPath)
}

/**
 * Parse a semver string into a Version object
 */
export function parseSemver(tag: string): SemverVersion | null {
  return semverParse(tag) || null
}

/**
 * Check if a tag is a semver tag
 */
export function isSemverTag(tag: string): boolean {
  return semverParse(tag) !== undefined
}

/**
 * Check if a version is a prerelease
 */
export function isPrerelease(tag: string): boolean {
  const prereleaseArray = semverPrerelease(tag)
  return prereleaseArray !== undefined && prereleaseArray.length > 0
}

/**
 * Check if a version is stable (not a prerelease)
 */
export function isStableVersion(tag: string): boolean {
  return !isPrerelease(tag)
}

/**
 * Get the deployment path for a version
 * Stable versions go to /latest/, prereleases go to /[version]/
 */
export function getDeploymentPath(version: string, prefix = `/polen`): string {
  const isStable = isStableVersion(version)
  return isStable ? `${prefix}/latest/` : `${prefix}/${version}/`
}

/**
 * Get all versions from the repository
 */
export async function getVersions(repoPath?: string): Promise<Version[]> {
  const git = getGit(repoPath)
  const tags = await git.tags()
  const versions: Version[] = []

  for (const tag of tags.all) {
    if (!isSemverTag(tag)) continue

    const semver = parseSemver(tag)
    if (!semver) continue

    try {
      const tagInfo = await git.show([`${tag}^{commit}`, `--format=%H %at`])
      const [commit, timestamp] = tagInfo.trim().split(` `)

      if (!commit) continue

      versions.push({
        git: {
          tag,
          sha: commit,
        },
        date: new Date(parseInt(timestamp || `0`, 10) * 1000),
        isPrerelease: isPrerelease(tag),
        semver,
      })
    } catch (e) {
      // Skip tags that can't be resolved
      console.warn(`Failed to get info for tag ${tag}:`, e)
    }
  }

  // Sort by semver (newest first) - reverse of semverCompare
  return versions.sort((a, b) => semverCompare(b.semver, a.semver))
}

/**
 * Get dist-tag information (latest, next, etc.)
 */
export async function getDistTag(tagName: string, repoPath?: string): Promise<DistTagInfo | null> {
  const git = getGit(repoPath)
  try {
    const commit = await git.revparse([tagName])

    // Find semver tag at this commit
    const tags = await git.tag([`--points-at`, commit])
    const semverTags = tags.split(`\n`).filter(isSemverTag)

    return {
      name: tagName,
      commit: commit.trim(),
      semverTag: semverTags[0],
    }
  } catch (e) {
    return null
  }
}

/**
 * Get the 'latest' dist-tag
 */
export async function getDistTagLatest(repoPath?: string): Promise<DistTagInfo | null> {
  return getDistTag(`latest`, repoPath)
}

/**
 * Get all dist-tags
 */
export async function getDistTags(repoPath?: string): Promise<DistTagInfo[]> {
  const commonDistTags = [`latest`, `next`, `beta`, `alpha`, `canary`]
  const distTags: DistTagInfo[] = []

  for (const tag of commonDistTags) {
    const info = await getDistTag(tag, repoPath)
    if (info) {
      distTags.push(info)
    }
  }

  return distTags
}

/**
 * Get the latest stable version
 */
export async function getLatestStableVersion(repoPath?: string): Promise<Version | null> {
  const versions = await getVersions(repoPath)
  return versions.find(v => !v.isPrerelease) || null
}

/**
 * Get the latest prerelease version
 */
export async function getLatestPrereleaseVersion(repoPath?: string): Promise<Version | null> {
  const versions = await getVersions(repoPath)
  return versions.find(v => v.isPrerelease) || null
}

/**
 * Get version at a specific commit
 */
export async function getVersionAtCommit(commit: string, repoPath?: string): Promise<Version | null> {
  const git = getGit(repoPath)
  const tags = await git.tag([`--points-at`, commit])
  const semverTags = tags.split(`\n`).filter(isSemverTag)

  if (semverTags.length === 0) return null

  // Get full info for the first semver tag
  const versions = await getVersions(repoPath)
  return versions.find(v => v.git.tag === semverTags[0]) || null
}

/**
 * Get deployment history for demos (versions that should have demos)
 */
export async function getDeploymentHistory(minimumVersion?: string, repoPath?: string): Promise<Version[]> {
  const versions = await getVersions(repoPath)

  if (!minimumVersion) return versions

  const minSemver = parseSemver(minimumVersion)
  if (!minSemver) return versions

  return versions.filter(v => semverCompare(v.semver, minSemver) >= 0)
}

/**
 * Get the current development cycle: latest stable + all newer prereleases
 */
export async function getCurrentDevelopmentCycle(repoPath?: string): Promise<DevelopmentCycle> {
  const latestStable = await getLatestStableVersion(repoPath)
  if (!latestStable) {
    // No stable version yet, return all versions as prereleases
    const allVersions = await getVersions(repoPath)
    return {
      stable: null,
      prereleases: allVersions,
      all: allVersions,
    }
  }

  const allVersions = await getVersions(repoPath)
  const prereleases = allVersions.filter(
    v => v.isPrerelease && semverCompare(v.semver, latestStable.semver) > 0,
  )

  return {
    stable: latestStable,
    prereleases,
    all: [latestStable, ...prereleases],
  }
}

/**
 * Get versions since a specific version (inclusive)
 */
export async function getVersionsSince(
  sinceVersion: string,
  skipVersions: string[] = [],
  repoPath?: string,
): Promise<Version[]> {
  const sinceSemver = parseSemver(sinceVersion)
  if (!sinceSemver) {
    throw new Error(`Invalid version: ${sinceVersion}`)
  }

  const allVersions = await getVersions(repoPath)
  return allVersions.filter(v => {
    // Skip if in skip list
    if (skipVersions.includes(v.git.tag)) return false
    // Include if >= sinceVersion
    return semverCompare(v.semver, sinceSemver) >= 0
  })
}

/**
 * Get all prereleases from past development cycles
 *
 * A development cycle is the set of prereleases between stable versions.
 * This returns all prereleases that are not part of the current development cycle.
 *
 * Note: This only returns prereleases. Stable versions are not part of development cycles.
 */
export async function getPastDevelopmentCycles(repoPath?: string): Promise<Version[]> {
  const allVersions = await getVersions(repoPath)
  const currentCycle = await getCurrentDevelopmentCycle(repoPath)
  const currentCycleTags = new Set(currentCycle.all.map(v => v.git.tag))

  // Return prereleases not in the current cycle
  return allVersions.filter(v => {
    return v.isPrerelease && !currentCycleTags.has(v.git.tag)
  })
}

/**
 * Get a complete registry of all versions and dist-tags
 */
export async function getVersionCatalog(repoPath?: string): Promise<VersionCatalog> {
  const [allVersions, distTagInfos] = await Promise.all([
    getVersions(repoPath),
    getDistTags(repoPath),
  ])

  // Map dist-tags to versions
  const distTags: VersionCatalog[`distTags`] = {}
  for (const tagInfo of distTagInfos) {
    if (tagInfo.semverTag) {
      const version = allVersions.find(v => v.git.tag === tagInfo.semverTag)
      if (version) {
        distTags[tagInfo.name] = version
      }
    }
  }

  // Separate stable and prerelease versions
  const stable = allVersions.filter(v => !v.isPrerelease)
  const prerelease = allVersions.filter(v => v.isPrerelease)

  return {
    distTags,
    versions: allVersions,
    stable,
    prerelease,
  }
}

// Legacy class export for backward compatibility
// TODO: Remove this once all usages are migrated
export class VersionHistory {
  static parseSemver = parseSemver
  static isSemverTag = isSemverTag
  static isPrerelease = isPrerelease
  static isStableVersion = isStableVersion
  static getDeploymentPath = getDeploymentPath
}
