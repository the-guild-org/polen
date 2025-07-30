import { Hydra } from '#lib/hydra/$'
import { S } from '#lib/kit-temp/effect'
import { Order } from 'effect'
import { Revision } from '../revision/$.js'
import { SchemaDefinition } from '../schema-definition/$.js'

// ============================================================================
// Schema
// ============================================================================

export const Unversioned = Hydra.Schema.Hydratable(
  S.TaggedStruct('SchemaUnversioned', {
    revisions: S.Array(Revision.Revision),
    definition: SchemaDefinition.SchemaDefinition,
  }).annotations({
    identifier: 'SchemaUnversioned',
    title: 'Unversioned Schema',
    description: 'A GraphQL schema without semantic versioning',
    adt: { name: 'Schema' },
  }),
)

export type Unversioned = S.Schema.Type<typeof Unversioned>

// ============================================================================
// Constructors
// ============================================================================

export const make = Unversioned.make

/**
 * Create a dehydrated SchemaUnversioned with no unique keys.
 * @returns Dehydrated schema with _tag and _dehydrated marker
 */
export const makeDehydrated = Unversioned.makeDehydrated

/**
 * Dehydrate a SchemaUnversioned instance.
 * Since this schema has no unique keys, only _tag and _dehydrated marker are preserved.
 * @param value - A hydrated SchemaUnversioned instance
 * @returns Dehydrated schema with _tag and _dehydrated marker
 */
export const dehydrate = Unversioned.dehydrate

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
