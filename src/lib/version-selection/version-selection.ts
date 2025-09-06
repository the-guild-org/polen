import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { S } from '#lib/kit-temp/effect'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { Array, HashMap, HashSet, Match, Option, pipe } from 'effect'

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

// ============================================================================
// Domain Logic - Resolution Functions
// ============================================================================

/**
 * Resolve document content for a given version coverage.
 *
 * @param document - The document to resolve content from
 * @param versionCoverage - The version coverage to use (optional, defaults to latest)
 * @returns The resolved document content
 * @throws {Error} If version is not found in document
 */
export const resolveDocumentContent = (
  document: Document.Document,
  versionCoverage?: VersionCoverage | null,
): string => {
  if (Document.Unversioned.is(document)) {
    return document.document
  }

  // If no version coverage specified, use latest
  if (!versionCoverage) {
    return Document.Versioned.getContentForLatestVersionOrThrow(document)
  }

  // Get the latest version from the coverage
  const version = getLatest(versionCoverage)
  const content = Document.Versioned.getContentForVersion(document, version)

  if (!content) {
    throw new Error(`Version ${Version.encodeSync(version)} not covered by document`)
  }

  return content
}

/**
 * Resolve schema from catalog for a given version coverage.
 *
 * @param catalog - The schema catalog
 * @param versionCoverage - The version coverage to use (optional, defaults to latest)
 * @returns The resolved schema
 * @throws {Error} If catalog is versioned but version is not found
 */
export const resolveCatalogSchema = (
  catalog: Catalog.Catalog,
  versionCoverage?: VersionCoverage | null,
): Schema.Schema => {
  if (Catalog.Unversioned.is(catalog)) {
    return catalog.schema
  }

  // If no version coverage specified, use latest
  if (!versionCoverage) {
    return Catalog.Versioned.getLatestOrThrow(catalog)
  }

  // Get the latest version from the coverage
  const version = getLatest(versionCoverage)

  const schemaOption = HashMap.get(catalog.entries, version)
  if (Option.isNone(schemaOption)) {
    throw new Error(`Version ${Version.encodeSync(version)} not found in catalog`)
  }

  return Option.getOrThrow(schemaOption)
}

/**
 * Resolve both document content and schema for a given version coverage.
 * This is the primary resolution function that handles all combinations
 * of versioned/unversioned documents and catalogs.
 *
 * @param document - The document to resolve content from
 * @param catalog - The schema catalog (optional)
 * @param versionCoverage - The version coverage to use (optional, defaults to latest)
 * @returns Object with resolved content and optional schema
 * @throws {Error} If versions don't match between document and catalog
 */
export const resolveDocumentAndSchema = (
  document: Document.Document,
  catalog?: Catalog.Catalog,
  versionCoverage?: VersionCoverage | null,
): { content: string; schema?: Schema.Schema } => {
  // Handle unversioned document
  if (Document.Unversioned.is(document)) {
    const result: { content: string; schema?: Schema.Schema } = {
      content: document.document,
    }
    if (catalog) {
      result.schema = resolveCatalogSchema(catalog, null)
    }
    return result
  }

  // Handle versioned document
  const content = resolveDocumentContent(document, versionCoverage)

  if (!catalog) {
    return { content }
  }

  // Cannot use version coverage with unversioned catalog
  if (versionCoverage && Catalog.Unversioned.is(catalog)) {
    throw new Error('Cannot use a version coverage with an unversioned catalog')
  }

  const schema = resolveCatalogSchema(catalog, versionCoverage)
  return { content, schema }
}
