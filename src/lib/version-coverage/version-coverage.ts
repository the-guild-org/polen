import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'
import { Array, HashSet, pipe } from 'effect'

// ============================================================================
// Schema
// ============================================================================

export class VersionCoverageUnversioned
  extends S.TaggedClass<VersionCoverageUnversioned>()('VersionCoverageUnversioned', {})
{}
export const VersionCoverageOne = Version.Version
export const VersionCoverageSet = S.HashSet(Version.Version)

/**
 * A selection of versions - either unversioned (applies to all), a single version, or a set of versions.
 * Used as keys in versioned documents to map version(s) to document content.
 */
export const VersionCoverage = S.Union(
  VersionCoverageUnversioned,
  VersionCoverageOne,
  VersionCoverageSet,
).annotations({
  identifier: 'VersionCoverage',
  description: 'Unversioned (all versions), a single version, or a set of versions',
})

// ============================================================================
// Types
// ============================================================================

export type VersionCoverage = S.Schema.Type<typeof VersionCoverage>

// ============================================================================
// Constructors
// ============================================================================

/**
 * Create an unversioned coverage that applies to all versions
 */
export const unversioned = (): VersionCoverage => new VersionCoverageUnversioned({})

/**
 * Create a single version coverage
 */
export const single = (version: Version.Version): VersionCoverage => version

/**
 * Create a version set coverage
 */
export const set = (versions: Version.Version[]): VersionCoverage => HashSet.fromIterable(versions)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(VersionCoverage)

export const isUnversioned = (coverage: VersionCoverage): coverage is VersionCoverageUnversioned =>
  coverage instanceof VersionCoverageUnversioned

export const isSingle = (coverage: VersionCoverage): coverage is Version.Version => Version.is(coverage)

export const isSet = (coverage: VersionCoverage): coverage is HashSet.HashSet<Version.Version> =>
  !isUnversioned(coverage) && !Version.is(coverage)

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
  if (isUnversioned(versionCoverage)) {
    return true // Unversioned applies to all versions
  }
  if (Version.is(versionCoverage)) {
    return Version.equivalence(versionCoverage, version)
  }
  return HashSet.has(versionCoverage, version)
}

/**
 * Get display label for UI
 */
export const toLabel = (versionCoverage: VersionCoverage): string => {
  if (isUnversioned(versionCoverage)) {
    return 'All Versions'
  }
  return pipe(versionCoverage, encodeSync, Array.ensure, Array.map(_ => _.toString()), Array.join(', '))
}

/**
 * Get all versions from a selection
 */
export const toVersions = (versionCoverage: VersionCoverage): Version.Version[] => {
  if (isUnversioned(versionCoverage)) {
    return [] // Unversioned doesn't map to specific versions
  }
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
 * @throws {Error} If the version set is empty or if called on unversioned coverage
 */
export const getLatest = (versionCoverage: VersionCoverage): Version.Version => {
  if (isUnversioned(versionCoverage)) {
    throw new Error('Cannot get latest version from unversioned coverage')
  }
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

/**
 * Check if a version coverage matches a specific version.
 * Unversioned always matches, single version must be equal, set must contain the version.
 */
export const matches = (coverage: VersionCoverage, version: Version.Version): boolean => {
  return contains(coverage, version)
}
