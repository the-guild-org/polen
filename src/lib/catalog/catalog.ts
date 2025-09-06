import { S } from '#lib/kit-temp/effect'
import { Schema } from '#lib/schema/$'
import { VersionCoverage } from '#lib/version-coverage'
import { Version } from '#lib/version/$'
import { HashMap, Match, Option } from 'effect'
import * as Unversioned from './unversioned.js'
import * as Versioned from './versioned.js'

export * as Unversioned from './unversioned.js'
export * as Versioned from './versioned.js'

// ============================================================================
// Schema
// ============================================================================

export const Catalog = S.Union(Versioned.Versioned, Unversioned.Unversioned).annotations({
  identifier: 'Catalog',
  title: 'Schema Catalog',
  description: 'A catalog of GraphQL schemas and their revision history',
})

export type Catalog = typeof Catalog.Type

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Catalog)

// ============================================================================
// Pattern Matching
// ============================================================================

export const fold = <$A>(
  onVersioned: (catalog: Versioned.Versioned) => $A,
  onUnversioned: (catalog: Unversioned.Unversioned) => $A,
) =>
(catalog: Catalog): $A => catalog._tag === 'CatalogVersioned' ? onVersioned(catalog) : onUnversioned(catalog)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Catalog)
export const decodeSync = S.decodeSync(Catalog)
export const encode = S.encode(Catalog)
export const encodeSync = S.encodeSync(Catalog)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Catalog)

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get the number of versions in a catalog.
 * For versioned catalogs, this is the number of entries.
 * For unversioned catalogs, this is always 1.
 */
export const getVersionCount = (catalog: Catalog): number =>
  fold(
    (versioned) => HashMap.size(versioned.entries),
    (_unversioned) => 1, // Unversioned catalog is effectively one version
  )(catalog)

/**
 * Get the version string from a schema.
 * Returns the stringified version for versioned schemas, or '__UNVERSIONED__' for unversioned schemas.
 */
export const getSchemaVersionString = (schema: Schema.Schema): string => {
  const version = Schema.getVersion(schema)
  return version ? Version.encodeSync(version) : '__UNVERSIONED__'
}

/**
 * Get the version string from a schema.
 * Returns the stringified version for versioned schemas, or '__UNVERSIONED__' for unversioned schemas.
 */
export const getLatest = (catalog: Catalog): Schema.Schema =>
  Match.value(catalog).pipe(Match.tagsExhaustive({
    CatalogVersioned: Versioned.getLatestOrThrow,
    CatalogUnversioned: (unversioned) => unversioned.schema,
  }))

/**
 * Get the latest version identifier from a catalog.
 * Returns the version for versioned catalogs, or null for unversioned catalogs.
 */
export const getLatestVersion = (catalog?: Catalog): Version.Version | null => {
  if (!catalog) return null
  return Match.value(catalog).pipe(
    Match.tagsExhaustive({
      CatalogUnversioned: () => null,
      CatalogVersioned: (cat) => Versioned.getVersions(cat)[0] ?? null,
    }),
  )
}

// ============================================================================
// Resolution Functions
// ============================================================================

/**
 * Resolve schema from catalog for a given version coverage.
 *
 * @param catalog - The schema catalog
 * @param versionCoverage - The version coverage to use (optional, defaults to latest)
 * @returns The resolved schema
 * @throws {Error} If catalog is versioned but version is not found
 */
export const resolveCatalogSchema = (
  catalog: Catalog,
  versionCoverage?: VersionCoverage.VersionCoverage | null,
): Schema.Schema => {
  if (Unversioned.is(catalog)) {
    return catalog.schema
  }

  // If no version coverage specified, use latest
  if (!versionCoverage) {
    return Versioned.getLatestOrThrow(catalog)
  }

  // Get the latest version from the coverage
  const version = VersionCoverage.getLatest(versionCoverage)

  const schemaOption = HashMap.get(catalog.entries, version)
  if (Option.isNone(schemaOption)) {
    throw new Error(`Version ${Version.encodeSync(version)} not found in catalog`)
  }

  return Option.getOrThrow(schemaOption)
}
