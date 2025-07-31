import { S } from '#lib/kit-temp/effect'
import { Schema } from '../schema/$.js'

// ============================================================================
// Schema
// ============================================================================

export const Unversioned = S.TaggedStruct('CatalogUnversioned', {
  schema: Schema.Unversioned.Unversioned,
}).annotations({
  identifier: 'CatalogUnversioned',
  title: 'Unversioned Catalog',
  description: 'A catalog of an unversioned GraphQL schema with its revision history',
  adt: { name: 'Catalog' },
})

export type Unversioned = S.Schema.Type<typeof Unversioned>

// ============================================================================
// Constructors
// ============================================================================

export const make = Unversioned.make

// ============================================================================
// Guards
// ============================================================================

export const is = S.is(Unversioned)

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(Unversioned)
export const encode = S.encode(Unversioned)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Unversioned)
