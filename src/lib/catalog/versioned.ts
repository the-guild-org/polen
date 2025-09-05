import { S } from '#lib/kit-temp/effect'
import { Schema } from '../schema/$.js'

// ============================================================================
// Schema
// ============================================================================

export const Versioned = S.TaggedStruct('CatalogVersioned', {
  entries: S.Array(Schema.Versioned.Versioned),
}).annotations({
  identifier: 'CatalogVersioned',
  title: 'Versioned Catalog',
  description: 'A catalog of versioned GraphQL schemas with their revision history',
  adt: { name: 'Catalog' },
})

export type Versioned = typeof Versioned.Type

// ============================================================================
// Constructors
// ============================================================================

export const make = Versioned.make

// ============================================================================
// Guards
// ============================================================================

export const is = S.is(Versioned)

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(Versioned)
export const encode = S.encode(Versioned)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Versioned)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get the latest schema definition from a versioned catalog.
 * The latest version is the first entry in the catalog (entries are ordered newest to oldest).
 *
 * @param catalog - The versioned catalog
 * @returns The GraphQL schema definition of the latest version
 * @throws {Error} If the catalog has no entries
 */
export const getLatest = (catalog: Versioned): Schema.Schema => {
  const latestEntry = catalog.entries[0]
  if (!latestEntry) {
    throw new Error('Versioned catalog has no entries - cannot get latest schema')
  }
  return latestEntry
}
