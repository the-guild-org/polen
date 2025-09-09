import { S } from '#lib/kit-temp/effect'
import { Order } from 'effect'
import { Revision } from '../revision/$.js'
import { SchemaDefinition } from '../schema-definition/$.js'

// ============================================================================
// Schema
// ============================================================================

export const Unversioned = S.TaggedStruct('SchemaUnversioned', {
  revisions: S.Array(Revision.Revision),
  definition: SchemaDefinition.SchemaDefinition,
  categories: S.optional(
    S.Array(S.Struct({
      name: S.String,
      types: S.Array(S.String),
    })),
    { default: () => [] },
  ),
}).annotations({
  identifier: 'SchemaUnversioned',
  title: 'Unversioned Schema',
  description: 'A GraphQL schema without semantic versioning',
  adt: { name: 'Schema' },
})

export type Unversioned = typeof Unversioned.Type

// ============================================================================
// Constructors
// ============================================================================

export const make = Unversioned.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Unversioned)

// ============================================================================
// Ordering
// ============================================================================

/**
 * Orders by first revision date if any
 */
export const order: Order.Order<Unversioned> = Order.mapInput(Order.string, (schema) => schema.revisions[0]?.date ?? '')

export const min = Order.min(order)
export const max = Order.max(order)
export const lessThan = Order.lessThan(order)
export const greaterThan = Order.greaterThan(order)

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(Unversioned)
export const encode = S.encode(Unversioned)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Unversioned)
