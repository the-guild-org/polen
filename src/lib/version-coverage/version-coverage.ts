import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'
import { Array, HashSet, pipe } from 'effect'

// ============================================================================
// Schema
// ============================================================================

export const VersionCoverageOne = Version.Version
export const VersionCoverageSet = S.HashSet(Version.Version)

/**
 * A selection of versions - either a single version or a set of versions.
 * Used as keys in versioned documents to map version(s) to document content.
 */
export const VersionCoverage = S.Union(
  VersionCoverageOne,
  VersionCoverageSet,
).annotations({
  identifier: 'VersionCoverage',
  description: 'A single version or set of versions',
})

// ============================================================================
// Types
// ============================================================================

export type VersionCoverage = S.Schema.Type<typeof VersionCoverage>

// ============================================================================
// Constructors
// ============================================================================

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(VersionCoverage)

export const isSingle = Version.is

export const isSet = (selection: VersionCoverage): selection is HashSet.HashSet<Version.Version> =>
  !Version.is(selection)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(VersionCoverage)
export const decodeSync = S.decodeSync(VersionCoverage)
export const encode = S.encode(VersionCoverage)
export const encodeSync = S.encodeSync(VersionCoverage)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(VersionCoverage)

// ============================================================================
// Domain Logic - Basic Operations
// ============================================================================

/**
 * Check if a version is contained in a selection
 */
export const contains = (
  versionCoverage: VersionCoverage,
  version: Version.Version,
): boolean => {
  if (Version.is(versionCoverage)) {
    return Version.equivalence(versionCoverage, version)
  }
  return HashSet.has(versionCoverage, version)
}

/**
 * Get display label for UI
 */
export const toLabel = (versionCoverage: VersionCoverage): string => {
  return pipe(versionCoverage, encodeSync, Array.ensure, Array.map(_ => _.toString()), Array.join(', '))
}

/**
 * Get all versions from a selection
 */
export const toVersions = (versionCoverage: VersionCoverage): Version.Version[] => {
  if (Version.is(versionCoverage)) {
    return [versionCoverage]
  }
  return HashSet.toValues(versionCoverage)
}

/**
 * Get the latest (highest) version from a version coverage.
 * For single versions, returns the version itself.
 * For version sets, returns the maximum version according to Version ordering.
 *
 * @param versionCoverage - The version coverage to get the latest version from
 * @returns The latest version
 * @throws {Error} If the version set is empty
 */
export const getLatest = (versionCoverage: VersionCoverage): Version.Version => {
  if (Version.is(versionCoverage)) {
    return versionCoverage
  }

  // For HashSet, convert to array and find max
  const versions = HashSet.toValues(versionCoverage)
  if (versions.length === 0) {
    throw new Error('Cannot get latest version from empty version set')
  }

  // Use Version.max which takes exactly 2 arguments
  // Reduce the array to find the maximum
  return versions.reduce((latest, current) => Version.max(latest, current))
}
