import { S } from '#lib/kit-temp/effect'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { Match } from 'effect'
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
    (versioned) => versioned.entries.length,
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
export const getLatestSchema = (catalog: Catalog): Schema.Schema =>
  Match.value(catalog).pipe(Match.tagsExhaustive({
    CatalogVersioned: (versioned) => {
      // Entries are sorted newest first, so get the first entry
      const latestEntry = versioned.entries[0]!
      return latestEntry
    },
    CatalogUnversioned: (unversioned) => {
      return unversioned.schema
    },
  }))

/**
 * Get the latest version identifier from a catalog.
 * Returns the version for versioned catalogs, or null for unversioned catalogs.
 */
export const getLatestVersionIdentifier = (catalog?: Catalog): Version.Version | null => {
  if (!catalog) return null
  return Match.value(catalog).pipe(
    Match.tagsExhaustive({
      CatalogUnversioned: () => null,
      CatalogVersioned: (cat) => cat.entries[0]?.version ?? null,
    }),
  )
}
