import { compare as semverCompare, parse as semverParse, type Version as SemVerVersion } from '@vltpkg/semver'
import { type SimpleGit, simpleGit } from 'simple-git'
import { getSemVerString, normalizeSemVerInput, type SemVerInput } from './semver.ts'
import type { Catalog, DevelopmentCycle, DistTagInfo, Version } from './types.ts'

export type { Catalog, DevelopmentCycle, DistTagInfo, Version } from './types.ts'

// Helper to get git instance
const getGit = (repoPath: string = process.cwd()): SimpleGit => {
  return simpleGit(repoPath)
}

/**
 * Parse a semver string into a Version object
 */
export const parseSemVer = (tag: string): SemVerVersion | null => {
  return semverParse(tag) || null
}

/**
 * Check if a tag is a semver tag
 *
 * @param semVerInput - Either a string, SemVerString or SemVerObject
 * @returns True if the input is a valid semver
 */
export const isSemVerTag = (semVerInput: string | SemVerInput): boolean => {
  if (typeof semVerInput === 'string') {
    return semverParse(semVerInput) !== undefined
  }
  // If it's already a parsed object, it's valid
  return true
}

/**
 * Check if a version is a prerelease
 *
 * @param semVerInput - Either a string, SemVerString or SemVerObject
 * @returns True if the version has prerelease components
 */
export const isPrerelease = (semVerInput: string | SemVerInput): boolean => {
  // If it's an object (parsed semver), use normalizeSemVerInput
  if (typeof semVerInput === 'object') {
    const parsed = normalizeSemVerInput(semVerInput)
    return parsed.prerelease !== undefined && parsed.prerelease.length > 0
  }

  // For strings, try to parse directly
  const parsed = semverParse(semVerInput)
  if (!parsed) return false
  return parsed.prerelease !== undefined && parsed.prerelease.length > 0
}

/**
 * Check if a version is stable (not a prerelease)
 *
 * @param semVerInput - Either a string, SemVerString or SemVerObject
 * @returns True if the version is stable (no prerelease components)
 */
export const isStableVersion = (semVerInput: string | SemVerInput): boolean => {
  return !isPrerelease(semVerInput)
}

/**
 * Get the deployment path for a version
 * Stable versions go to /latest/, prereleases go to /[version]/
 *
 * @param semVerInput - Either a string, SemVerString or SemVerObject
 * @param prefix - Path prefix (defaults to `/polen`)
 * @returns The deployment path for the version
 */
export const getDeploymentPath = (semVerInput: string | SemVerInput, prefix = `/polen`): string => {
  const isStable = isStableVersion(semVerInput)

  // If it's a plain string, use it directly
  if (typeof semVerInput === 'string') {
    return isStable ? `${prefix}/latest/` : `${prefix}/${semVerInput}/`
  }

  // For objects, use getSemVerString
  const versionString = getSemVerString(semVerInput)
  return isStable ? `${prefix}/latest/` : `${prefix}/${versionString}/`
}

/**
 * Get all versions from the repository
 */
export const getVersions = async (repoPath?: string): Promise<Version[]> => {
  const git = getGit(repoPath)
  const tags = await git.tags()
  const versions: Version[] = []

  for (const tag of tags.all) {
    if (!isSemVerTag(tag)) continue

    const semver = parseSemVer(tag)
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
export const getDistTag = async (tagName: string, repoPath?: string): Promise<DistTagInfo | null> => {
  const git = getGit(repoPath)
  try {
    const commit = await git.revparse([tagName])

    // Find semver tag at this commit
    const tags = await git.tag([`--points-at`, commit])
    const semverTags = tags.split(`\n`).filter(isSemVerTag)

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
export const getDistTagLatest = async (repoPath?: string): Promise<DistTagInfo | null> => {
  return getDistTag(`latest`, repoPath)
}

/**
 * Get all dist-tags
 */
export const getDistTags = async (repoPath?: string): Promise<DistTagInfo[]> => {
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
export const getLatestStableVersion = async (repoPath?: string): Promise<Version | null> => {
  const versions = await getVersions(repoPath)
  return versions.find(v => !v.isPrerelease) || null
}

/**
 * Get the latest prerelease version
 */
export const getLatestPrereleaseVersion = async (repoPath?: string): Promise<Version | null> => {
  const versions = await getVersions(repoPath)
  return versions.find(v => v.isPrerelease) || null
}

/**
 * Get version at a specific commit
 */
export const getVersionAtCommit = async (commit: string, repoPath?: string): Promise<Version | null> => {
  const git = getGit(repoPath)
  const tags = await git.tag([`--points-at`, commit])
  const semverTags = tags.split(`\n`).filter(isSemVerTag)

  if (semverTags.length === 0) return null

  // Get full info for the first semver tag
  const versions = await getVersions(repoPath)
  return versions.find(v => v.git.tag === semverTags[0]) || null
}

/**
 * Get deployment history for demos (versions that should have demos)
 *
 * @param minimumVersion - Minimum version to include (optional)
 * @param repoPath - Path to the repository (optional)
 * @returns Array of versions that meet the minimum version requirement
 */
export const getDeploymentHistory = async (
  minimumVersion?: string | SemVerInput,
  repoPath?: string,
): Promise<Version[]> => {
  const versions = await getVersions(repoPath)

  if (!minimumVersion) return versions

  // If it's a plain string, parse it
  if (typeof minimumVersion === 'string') {
    const minSemver = parseSemVer(minimumVersion)
    if (!minSemver) return versions
    return versions.filter(v => semverCompare(v.semver, minSemver) >= 0)
  }

  // For SemVerInput (object), use normalizeSemVerInput
  const minSemver = normalizeSemVerInput(minimumVersion)
  return versions.filter(v => semverCompare(v.semver, minSemver) >= 0)
}

/**
 * Get the current development cycle: latest stable + all newer prereleases
 */
export const getCurrentDevelopmentCycle = async (repoPath?: string): Promise<DevelopmentCycle> => {
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
export const getVersionsSince = async (
  sinceVersion: string,
  skipVersions: string[] = [],
  repoPath?: string,
): Promise<Version[]> => {
  const sinceSemver = parseSemVer(sinceVersion)
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
export const getPastDevelopmentCycles = async (repoPath?: string): Promise<Version[]> => {
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
export const getVersionCatalog = async (repoPath?: string): Promise<Catalog> => {
  const [allVersions, distTagInfos] = await Promise.all([
    getVersions(repoPath),
    getDistTags(repoPath),
  ])

  // Map dist-tags to versions
  const distTags: Catalog[`distTags`] = {}
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
  static parseSemVer = parseSemVer
  static isSemVerTag = isSemVerTag
  static isPrerelease = isPrerelease
  static isStableVersion = isStableVersion
  static getDeploymentPath = getDeploymentPath
}
