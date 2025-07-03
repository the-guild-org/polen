/**
 * Utility to determine which versions should be built based on configuration and constraints
 */

import { VersionHistory } from '#lib/version-history/index'
import { type DemoConfig, loadConfig, meetsMinimumPolenVersion } from './config.ts'

export interface BuildableVersions {
  /**
   * Array of version tags that should be built
   */
  versions: string[]
  /**
   * The current stable version tag, if any
   */
  stable?: string
  /**
   * Whether there are any versions to build
   */
  hasVersions: boolean
}

/**
 * Determines which versions should be built based on the current development cycle
 * and demo configuration constraints.
 *
 * @param config - Optional demo configuration. If not provided, will load from config file.
 * @returns Object containing buildable versions and metadata
 *
 * @example
 * ```ts
 * const { versions, stable, hasVersions } = await getBuildableVersions()
 * if (!hasVersions) {
 *   console.log('No versions to build')
 *   return
 * }
 *
 * for (const version of versions) {
 *   await buildVersion(version)
 * }
 * ```
 */
export async function getBuildableVersions(config?: DemoConfig): Promise<BuildableVersions> {
  // Load config if not provided
  const demoConfig = config ?? await loadConfig()

  // Get the current development cycle
  const cycle = await VersionHistory.getCurrentDevelopmentCycle()

  // If no stable version exists yet, return empty
  if (!cycle.stable) {
    return {
      versions: [],
      stable: undefined,
      hasVersions: false,
    }
  }

  // Filter versions that meet minimum Polen version requirement
  const buildableVersions = cycle.all
    .filter(v => meetsMinimumPolenVersion(demoConfig, v.git.tag))
    .map(v => v.git.tag)

  return {
    versions: buildableVersions,
    stable: cycle.stable.git.tag,
    hasVersions: buildableVersions.length > 0,
  }
}

/**
 * Gets buildable versions and formats them for GitHub Actions matrix output
 *
 * @param config - Optional demo configuration
 * @returns JSON string suitable for GitHub Actions matrix
 *
 * @example
 * ```ts
 * // In a GitHub Actions step
 * const matrixJson = await getBuildableVersionsAsMatrix()
 * core.setOutput('versions', matrixJson)
 * ```
 */
export async function getBuildableVersionsAsMatrix(config?: DemoConfig): Promise<string> {
  const { versions } = await getBuildableVersions(config)
  return JSON.stringify(versions)
}
