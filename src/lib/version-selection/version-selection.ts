import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'
import { HashSet } from 'effect'

// ============================================================================
// Schema
// ============================================================================

/**
 * A selection of versions - either a single version or a set of versions.
 * Used as keys in versioned documents to map version(s) to document content.
 */
export const VersionSelection = S.Union(
  Version.Version,
  S.HashSet(Version.Version),
).annotations({
  identifier: 'VersionSelection',
  description: 'A single version or set of versions',
})

// ============================================================================
// Types
// ============================================================================

export type VersionSelection = S.Schema.Type<typeof VersionSelection>

// ============================================================================
// Constructors
// ============================================================================

export const make = VersionSelection.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(VersionSelection)

export const isSingle = Version.is

export const isSet = (selection: VersionSelection): selection is HashSet.HashSet<Version.Version> =>
  !Version.is(selection)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(VersionSelection)
export const decodeSync = S.decodeSync(VersionSelection)
export const encode = S.encode(VersionSelection)
export const encodeSync = S.encodeSync(VersionSelection)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(VersionSelection)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Check if a version is contained in a selection
 */
export const contains = (
  selection: VersionSelection,
  version: Version.Version,
): boolean => {
  if (Version.is(selection)) {
    return Version.equivalence(selection, version)
  }
  return HashSet.has(selection, version)
}

/**
 * Get display label for UI
 */
export const toLabel = (selection: VersionSelection): string => {
  if (Version.is(selection)) {
    return Version.encodeSync(selection)
  }
  const versions = Array.from(selection)
    .sort((a, b) => Version.encodeSync(a).localeCompare(Version.encodeSync(b)))
  return versions.map(Version.encodeSync).join(', ')
}

/**
 * Get all versions from a selection
 */
export const toVersions = (selection: VersionSelection): Version.Version[] => {
  if (Version.is(selection)) {
    return [selection]
  }
  return Array.from(selection)
}

/**
 * Create a selection from a list of versions.
 * Returns a single version if list has one item, otherwise a HashSet.
 */
export const fromVersions = (versions: Version.Version[]): VersionSelection | null => {
  if (versions.length === 0) return null
  if (versions.length === 1) return versions[0]!
  return HashSet.fromIterable(versions)
}
