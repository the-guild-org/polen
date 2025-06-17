/**
 * Enhanced git version utilities (extractable as @the-guild/git-version-utils)
 * 
 * This module provides a clean abstraction over git operations for version management.
 * It could be extracted as a standalone package for reuse across projects.
 */

import { $ } from 'zx'
import { WorkflowError, safeExecute } from './error-handling.ts'

export interface GitTag {
  tag: string
  commit: string
  date: string
  message?: string
}

export interface SemverInfo {
  major: number
  minor: number
  patch: number
  prerelease?: string
  build?: string
  raw: string
}

export interface DevelopmentCycle {
  stable: GitTag | null
  prereleases: GitTag[]
  all: GitTag[]
}

export interface DistTag {
  name: string
  commit: string
  semverTag?: string
}

/**
 * Enhanced git version management utilities
 * 
 * This class provides a higher-level abstraction than the original VersionHistory
 * with better error handling, caching, and more comprehensive semver support.
 */
export class GitVersionUtils {
  private tagCache = new Map<string, GitTag[]>()
  private distTagCache = new Map<string, DistTag[]>()

  constructor(
    private workingDir: string = process.cwd(),
    private gitCommand: typeof $ = $,
  ) {}

  /**
   * Get all git tags with metadata
   */
  async getAllTags(options: { 
    pattern?: string
    sortBy?: 'version' | 'date'
    limit?: number
  } = {}): Promise<GitTag[]> {
    const cacheKey = `all-tags:${JSON.stringify(options)}`
    
    if (this.tagCache.has(cacheKey)) {
      return this.tagCache.get(cacheKey)!
    }

    return safeExecute('get-all-tags', async () => {
      const { pattern = '*', sortBy = 'version', limit } = options
      
      // Get tags with commit info
      const gitArgs = [
        'tag', '-l', pattern,
        '--sort=-version:refname',
        '--format=%(refname:short)|%(objectname)|%(creatordate:iso)|%(subject)'
      ]
      
      if (limit) {
        gitArgs.push(`--count=${limit}`)
      }
      
      const output = await this.gitCommand(gitArgs)
      const lines = output.stdout.trim().split('\n').filter(Boolean)
      
      const tags: GitTag[] = lines.map(line => {
        const [tag, commit, date, message] = line.split('|')
        return {
          tag: tag || '',
          commit: commit || '',
          date: date || '',
          message: message || '',
        }
      })

      // Sort by date if requested
      if (sortBy === 'date') {
        tags.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }

      this.tagCache.set(cacheKey, tags)
      return tags
    })
  }

  /**
   * Parse semver information from a version string
   */
  parseSemver(version: string): SemverInfo | null {
    const semverRegex = /^v?(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/
    const match = version.match(semverRegex)
    
    if (!match) return null
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5],
      raw: version,
    }
  }

  /**
   * Check if a version is a prerelease
   */
  isPrerelease(version: string): boolean {
    const semver = this.parseSemver(version)
    return semver?.prerelease !== undefined
  }

  /**
   * Check if a version is stable (not a prerelease)
   */
  isStableVersion(version: string): boolean {
    return !this.isPrerelease(version)
  }

  /**
   * Compare two semver versions
   */
  compareSemver(a: string, b: string): number {
    const semverA = this.parseSemver(a)
    const semverB = this.parseSemver(b)
    
    if (!semverA || !semverB) {
      // Fallback to string comparison
      return a.localeCompare(b)
    }

    // Compare major.minor.patch
    if (semverA.major !== semverB.major) return semverA.major - semverB.major
    if (semverA.minor !== semverB.minor) return semverA.minor - semverB.minor
    if (semverA.patch !== semverB.patch) return semverA.patch - semverB.patch

    // Handle prerelease comparison
    if (semverA.prerelease && !semverB.prerelease) return -1
    if (!semverA.prerelease && semverB.prerelease) return 1
    if (semverA.prerelease && semverB.prerelease) {
      return semverA.prerelease.localeCompare(semverB.prerelease)
    }

    return 0
  }

  /**
   * Get the latest stable version
   */
  async getLatestStableVersion(): Promise<GitTag | null> {
    return safeExecute('get-latest-stable', async () => {
      const tags = await this.getAllTags()
      const stableTags = tags.filter(tag => this.isStableVersion(tag.tag))
      
      if (stableTags.length === 0) return null
      
      // Sort by semver and return the latest
      stableTags.sort((a, b) => this.compareSemver(b.tag, a.tag))
      return stableTags[0]
    })
  }

  /**
   * Get current development cycle (latest stable + newer prereleases)
   */
  async getCurrentDevelopmentCycle(): Promise<DevelopmentCycle> {
    return safeExecute('get-current-cycle', async () => {
      const allTags = await this.getAllTags()
      const stable = await this.getLatestStableVersion()
      
      if (!stable) {
        return { stable: null, prereleases: [], all: [] }
      }

      // Find prereleases newer than the latest stable
      const prereleases = allTags.filter(tag => {
        if (!this.isPrerelease(tag.tag)) return false
        return this.compareSemver(tag.tag, stable.tag) > 0
      })

      return {
        stable,
        prereleases,
        all: [stable, ...prereleases],
      }
    })
  }

  /**
   * Get prereleases from past development cycles
   */
  async getPastDevelopmentCycles(): Promise<GitTag[]> {
    return safeExecute('get-past-cycles', async () => {
      const allTags = await this.getAllTags()
      const currentCycle = await this.getCurrentDevelopmentCycle()
      
      const currentVersions = new Set(currentCycle.all.map(v => v.tag))
      
      return allTags.filter(tag => 
        this.isPrerelease(tag.tag) && !currentVersions.has(tag.tag)
      )
    })
  }

  /**
   * Get npm dist-tag information
   */
  async getDistTags(): Promise<DistTag[]> {
    const cacheKey = 'dist-tags'
    
    if (this.distTagCache.has(cacheKey)) {
      return this.distTagCache.get(cacheKey)!
    }

    return safeExecute('get-dist-tags', async () => {
      try {
        // Try to get from package.json or npm registry
        const output = await this.gitCommand`npm dist-tag ls`.catch(() => ({ stdout: '' }))
        const lines = output.stdout.trim().split('\n').filter(Boolean)
        
        const distTags: DistTag[] = []
        
        for (const line of lines) {
          const [name, version] = line.split(': ')
          if (name && version) {
            // Get commit for this version
            try {
              const tagOutput = await this.gitCommand`git rev-list -n 1 ${version}`
              const commit = tagOutput.stdout.trim()
              
              distTags.push({
                name,
                commit,
                semverTag: version,
              })
            } catch {
              // Tag might not exist in git
              distTags.push({
                name,
                commit: '',
                semverTag: version,
              })
            }
          }
        }
        
        this.distTagCache.set(cacheKey, distTags)
        return distTags
      } catch (error) {
        // Fallback to empty if npm not available
        return []
      }
    })
  }

  /**
   * Get specific dist-tag information
   */
  async getDistTag(tagName: string): Promise<DistTag | null> {
    const distTags = await this.getDistTags()
    return distTags.find(tag => tag.name === tagName) || null
  }

  /**
   * Get deployment path for a version
   */
  getDeploymentPath(version: string, prefix: string = '/polen'): string {
    const isStable = this.isStableVersion(version)
    return isStable ? `${prefix}/latest/` : `${prefix}/${version}/`
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.tagCache.clear()
    this.distTagCache.clear()
  }

  /**
   * Get git repository information
   */
  async getRepositoryInfo(): Promise<{
    remoteUrl: string
    currentBranch: string
    latestCommit: string
  }> {
    return safeExecute('get-repo-info', async () => {
      const [remoteUrl, currentBranch, latestCommit] = await Promise.all([
        this.gitCommand`git remote get-url origin`.then(r => r.stdout.trim()),
        this.gitCommand`git branch --show-current`.then(r => r.stdout.trim()),
        this.gitCommand`git rev-parse HEAD`.then(r => r.stdout.trim()),
      ])

      return { remoteUrl, currentBranch, latestCommit }
    })
  }

  /**
   * Check if working directory is clean
   */
  async isWorkingDirectoryClean(): Promise<boolean> {
    return safeExecute('check-clean', async () => {
      const status = await this.gitCommand`git status --porcelain`
      return status.stdout.trim().length === 0
    })
  }

  /**
   * Create and push a new tag
   */
  async createTag(
    tagName: string, 
    message: string, 
    commit: string = 'HEAD',
  ): Promise<void> {
    return safeExecute('create-tag', async () => {
      await this.gitCommand`git tag -a ${tagName} ${commit} -m ${message}`
      await this.gitCommand`git push origin ${tagName}`
      
      // Clear cache since we've added a new tag
      this.clearCache()
    })
  }

  /**
   * Delete a tag locally and remotely
   */
  async deleteTag(tagName: string): Promise<void> {
    return safeExecute('delete-tag', async () => {
      // Delete locally
      await this.gitCommand`git tag -d ${tagName}`.catch(() => {})
      
      // Delete remotely
      await this.gitCommand`git push origin --delete ${tagName}`.catch(() => {})
      
      // Clear cache
      this.clearCache()
    })
  }
}

/**
 * Factory function for creating GitVersionUtils instances
 */
export function createGitVersionUtils(options: {
  workingDir?: string
  gitCommand?: typeof $
} = {}): GitVersionUtils {
  return new GitVersionUtils(options.workingDir, options.gitCommand)
}

/**
 * Utility functions for common version operations
 */
export const VersionUtils = {
  /**
   * Sort versions in semver order
   */
  sortVersions(versions: string[], descending: boolean = true): string[] {
    const utils = new GitVersionUtils()
    const sorted = [...versions].sort((a, b) => utils.compareSemver(a, b))
    return descending ? sorted.reverse() : sorted
  },

  /**
   * Filter versions by type
   */
  filterVersions(versions: string[], type: 'stable' | 'prerelease' | 'all' = 'all'): string[] {
    const utils = new GitVersionUtils()
    
    switch (type) {
      case 'stable':
        return versions.filter(v => utils.isStableVersion(v))
      case 'prerelease':
        return versions.filter(v => utils.isPrerelease(v))
      default:
        return versions
    }
  },

  /**
   * Get version range
   */
  getVersionsInRange(
    versions: string[], 
    from: string, 
    to?: string,
  ): string[] {
    const utils = new GitVersionUtils()
    
    return versions.filter(version => {
      if (utils.compareSemver(version, from) < 0) return false
      if (to && utils.compareSemver(version, to) > 0) return false
      return true
    })
  },
}

// Re-export original VersionHistory for backwards compatibility
export { VersionHistory } from '../../../src/lib/version-history/index.js'