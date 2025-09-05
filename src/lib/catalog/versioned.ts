import { S } from '#lib/kit-temp/effect'
import { Array, HashMap, Iterable, Order, pipe } from 'effect'
import { Schema } from '../schema/$.js'
import { Version } from '../version/$.js'

// ============================================================================
// Schema
// ============================================================================

export const Versioned = S.TaggedStruct('CatalogVersioned', {
  entries: S.HashMap({
    key: Version.Version,
    value: Schema.Versioned.Versioned,
  }),
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
 * The latest version is determined by Version.max comparison.
 *
 * @param catalog - The versioned catalog
 * @returns The GraphQL schema definition of the latest version
 * @throws {Error} If the catalog has no entries
 */
export const getLatestOrThrow = (catalog: Versioned): Schema.Versioned.Versioned => {
  const schema = getAll(catalog)[0]
  if (!schema) {
    throw new Error('Versioned catalog has no entries - cannot get latest schema')
  }
  return schema
}

/**
 * Get all schemas sorted by version (newest first)
 */
export const getAll = (catalog: Versioned): Schema.Versioned.Versioned[] => {
  return pipe(
    catalog.entries,
    HashMap.values,
    Array.fromIterable,
    // Put newest versions first in array
    Array.sort(Order.reverse(Schema.Versioned.order)),
  )
}

/**
 * Get all versions sorted (newest first)
 */
export const getVersions = (catalog: Versioned): Version.Version[] => {
  return pipe(
    catalog,
    getAll,
    Array.map(_ => _.version),
  )
}
