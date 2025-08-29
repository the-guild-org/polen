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

export type Versioned = S.Schema.Type<typeof Versioned>

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
