/**
 * Version history types
 */

import type { Version as SemVer } from '@vltpkg/semver'

export interface Version {
  /**
   * Git-related information for this version
   */
  git: {
    /**
     * The git tag name for this version (e.g., "1.2.3" or "2.0.0-beta.1")
     */
    tag: string
    /**
     * The full git commit SHA associated with this version tag
     */
    sha: string
  }
  /**
   * The date when this version tag was created
   */
  date: Date
  /**
   * Whether this version is a prerelease (contains -alpha, -beta, -rc, etc.)
   */
  isPrerelease: boolean
  /**
   * Parsed semver object containing major, minor, patch, and prerelease info
   */
  semver: SemVer
}

export interface DistTagInfo {
  name: string
  commit: string
  semverTag?: string
}

export interface DevelopmentCycle {
  stable: Version | null
  prereleases: Version[]
  all: Version[]
}

/**
 * Complete registry of all versions and dist-tags in the repository
 */
export interface Catalog {
  /**
   * All dist-tags mapped to their corresponding versions
   */
  distTags: {
    latest?: Version
    next?: Version
    [tagName: string]: Version | undefined
  }
  /**
   * All versions sorted by semver (newest first)
   */
  versions: Version[]
  /**
   * Quick access to commonly needed subsets
   */
  stable: Version[]
  prerelease: Version[]
}
