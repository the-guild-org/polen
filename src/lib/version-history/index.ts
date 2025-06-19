import {
  compare as semverCompare,
  parse as semverParse,
  prerelease as semverPrerelease,
  type Version,
} from '@vltpkg/semver'
import { type SimpleGit, simpleGit } from 'simple-git'

export interface VersionInfo {
  tag: string
  commit: string
  date: Date
  isPrerelease: boolean
  semver: Version
}

export interface DistTagInfo {
  name: string
  commit: string
  semverTag?: string
}

export interface DevelopmentCycle {
  stable: VersionInfo | null
  prereleases: VersionInfo[]
  all: VersionInfo[]
}

export class VersionHistory {
  private git: SimpleGit

  constructor(repoPath: string = process.cwd()) {
    this.git = simpleGit(repoPath)
  }

  /**
   * Parse a semver string into a Version object
   */
  static parseSemver(tag: string): Version | null {
    return semverParse(tag) || null
  }

  /**
   * Check if a tag is a semver tag
   */
  static isSemverTag(tag: string): boolean {
    return semverParse(tag) !== undefined
  }

  /**
   * Check if a version is a prerelease
   */
  static isPrerelease(tag: string): boolean {
    const prereleaseArray = semverPrerelease(tag)
    return prereleaseArray !== undefined && prereleaseArray.length > 0
  }

  /**
   * Check if a version is stable (not a prerelease)
   */
  static isStableVersion(tag: string): boolean {
    return !VersionHistory.isPrerelease(tag)
  }

  /**
   * Get the deployment path for a version
   * Stable versions go to /latest/, prereleases go to /[version]/
   */
  static getDeploymentPath(version: string, prefix: string = '/polen'): string {
    const isStable = VersionHistory.isStableVersion(version)
    return isStable ? `${prefix}/latest/` : `${prefix}/${version}/`
  }

  /**
   * Get all versions from the repository
   */
  async getVersions(): Promise<VersionInfo[]> {
    const tags = await this.git.tags()
    const versions: VersionInfo[] = []

    for (const tag of tags.all) {
      if (!VersionHistory.isSemverTag(tag)) continue

      const semver = VersionHistory.parseSemver(tag)
      if (!semver) continue

      try {
        const tagInfo = await this.git.show([`${tag}^{commit}`, `--format=%H %at`])
        const [commit, timestamp] = tagInfo.trim().split(' ')

        if (!commit) continue

        versions.push({
          tag,
          commit,
          date: new Date(parseInt(timestamp || '0', 10) * 1000),
          isPrerelease: VersionHistory.isPrerelease(tag),
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
  async getDistTag(tagName: string): Promise<DistTagInfo | null> {
    try {
      const commit = await this.git.revparse([tagName])

      // Find semver tag at this commit
      const tags = await this.git.tag([`--points-at`, commit])
      const semverTags = tags.split('\n').filter(VersionHistory.isSemverTag)

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
  async getDistTagLatest(): Promise<DistTagInfo | null> {
    return this.getDistTag('latest')
  }

  /**
   * Get all dist-tags
   */
  async getDistTags(): Promise<DistTagInfo[]> {
    const commonDistTags = ['latest', 'next', 'beta', 'alpha', 'canary']
    const distTags: DistTagInfo[] = []

    for (const tag of commonDistTags) {
      const info = await this.getDistTag(tag)
      if (info) {
        distTags.push(info)
      }
    }

    return distTags
  }

  /**
   * Get the latest stable version
   */
  async getLatestStableVersion(): Promise<VersionInfo | null> {
    const versions = await this.getVersions()
    return versions.find(v => !v.isPrerelease) || null
  }

  /**
   * Get the latest prerelease version
   */
  async getLatestPrereleaseVersion(): Promise<VersionInfo | null> {
    const versions = await this.getVersions()
    return versions.find(v => v.isPrerelease) || null
  }

  /**
   * Get version at a specific commit
   */
  async getVersionAtCommit(commit: string): Promise<VersionInfo | null> {
    const tags = await this.git.tag([`--points-at`, commit])
    const semverTags = tags.split('\n').filter(VersionHistory.isSemverTag)

    if (semverTags.length === 0) return null

    // Get full info for the first semver tag
    const versions = await this.getVersions()
    return versions.find(v => v.tag === semverTags[0]) || null
  }

  /**
   * Get deployment history for demos (versions that should have demos)
   */
  async getDeploymentHistory(minimumVersion?: string): Promise<VersionInfo[]> {
    const versions = await this.getVersions()

    if (!minimumVersion) return versions

    const minSemver = VersionHistory.parseSemver(minimumVersion)
    if (!minSemver) return versions

    return versions.filter(v => semverCompare(v.semver, minSemver) >= 0)
  }

  /**
   * Get the current development cycle: latest stable + all newer prereleases
   */
  async getCurrentDevelopmentCycle(): Promise<DevelopmentCycle> {
    const latestStable = await this.getLatestStableVersion()
    if (!latestStable) {
      // No stable version yet, return all versions as prereleases
      const allVersions = await this.getVersions()
      return {
        stable: null,
        prereleases: allVersions,
        all: allVersions,
      }
    }

    const allVersions = await this.getVersions()
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
  async getVersionsSince(sinceVersion: string, skipVersions: string[] = []): Promise<VersionInfo[]> {
    const sinceSemver = VersionHistory.parseSemver(sinceVersion)
    if (!sinceSemver) {
      throw new Error(`Invalid version: ${sinceVersion}`)
    }

    const allVersions = await this.getVersions()
    return allVersions.filter(v => {
      // Skip if in skip list
      if (skipVersions.includes(v.tag)) return false
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
  async getPastDevelopmentCycles(): Promise<VersionInfo[]> {
    const allVersions = await this.getVersions()
    const currentCycle = await this.getCurrentDevelopmentCycle()
    const currentCycleTags = new Set(currentCycle.all.map(v => v.tag))

    // Return prereleases not in the current cycle
    return allVersions.filter(v => {
      return v.isPrerelease && !currentCycleTags.has(v.tag)
    })
  }
}

// Export convenience functions
export async function getVersions(repoPath?: string): Promise<VersionInfo[]> {
  const versionHistory = new VersionHistory(repoPath)
  return versionHistory.getVersions()
}

export async function getDistTags(repoPath?: string): Promise<DistTagInfo[]> {
  const versionHistory = new VersionHistory(repoPath)
  return versionHistory.getDistTags()
}

export async function getLatestStableVersion(repoPath?: string): Promise<VersionInfo | null> {
  const versionHistory = new VersionHistory(repoPath)
  return versionHistory.getLatestStableVersion()
}
