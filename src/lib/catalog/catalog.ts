import { Hydra } from '#lib/hydra/$'
import { S } from '#lib/kit-temp/effect'
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

export type Catalog = S.Schema.Type<typeof Catalog>

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
export const encode = S.encode(Catalog)

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
 * Get all revisions from any catalog type.
 * For versioned catalogs, collects revisions from all entries.
 * For unversioned catalogs, returns the revisions directly.
 */
export const getRevisions = (catalog: Catalog): ReadonlyArray<Versioned.Entry['revisions'][number]> =>
  fold(
    (versioned) => versioned.entries.flatMap(entry => entry.revisions),
    (unversioned) => unversioned.schema.revisions,
  )(catalog)

// ============================================================================
// Bridge Factory
// ============================================================================

/**
 * Create a Bridge instance for managing catalog data with incremental loading.
 * This factory follows the pattern specified in the research plan.
 */
export const Bridge = Hydra.Bridge.makeMake(Catalog)
