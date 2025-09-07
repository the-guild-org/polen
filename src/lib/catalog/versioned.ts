import { S } from '#lib/kit-temp/effect'
import { Array, Either, HashMap, Iterable, Order, pipe } from 'effect'
import { Schema } from '../schema/$.js'
import { Version } from '../version/$.js'
import { EmptyCatalogError } from './catalog.js'

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
 * Get the latest schema from a versioned catalog.
 * The latest version is determined by Version.max comparison.
 *
 * @param catalog - The versioned catalog
 * @returns Either with the latest schema or EmptyCatalogError
 */
export const getLatest = (catalog: Versioned): Either.Either<Schema.Versioned.Versioned, EmptyCatalogError> => {
  const schema = getAll(catalog)[0]
  if (!schema) {
    return Either.left(
      new EmptyCatalogError({
        reason: 'Versioned catalog has no entries - cannot get latest schema',
      }),
    )
  }
  return Either.right(schema)
}

export const getOldestOrThrow = (catalog: Versioned): Schema.Versioned.Versioned => {
  const schemas = getAll(catalog)
  const schema = schemas[schemas.length - 1]
  if (!schema) throw new Error('Versioned catalog has no entries - cannot get oldest schema')
  return schema
}

/**
 * Get the latest schema definition from a versioned catalog.
 * The latest version is determined by Version.max comparison.
 *
 * @param catalog - The versioned catalog
 * @returns The GraphQL schema definition of the latest version
 * @throws {Error} If the catalog has no entries
 * @deprecated Use getLatest which returns Either
 */
export const getLatestOrThrow = (catalog: Versioned): Schema.Versioned.Versioned => {
  const result = getLatest(catalog)
  if (Either.isLeft(result)) {
    throw new Error(result.left.reason)
  }
  return result.right
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
