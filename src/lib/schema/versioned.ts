import { Hydra } from '#lib/hydra/$'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { Order } from 'effect'
import { Revision } from '../revision/$.js'
import { SchemaDefinition } from '../schema-definition/$.js'
import { Version } from '../version/$.js'

// ============================================================================
// Schema
// ============================================================================

export interface Versioned {
  readonly _tag: 'SchemaVersioned'
  readonly version: Version.Version
  readonly parent: Versioned | null
  readonly revisions: ReadonlyArray<Revision.Revision>
  readonly definition: SchemaDefinition.SchemaDefinition
}

export interface VersionedEncoded extends
  ObjReplace<Versioned, {
    readonly revisions: ReadonlyArray<S.Schema.Encoded<typeof Revision.Revision>>
    readonly version: S.Schema.Encoded<typeof Version.Version>
    readonly definition: S.Schema.Encoded<typeof SchemaDefinition.SchemaDefinition>
  }>
{}

export const Versioned = Hydra.Hydratable(
  S.TaggedStruct('SchemaVersioned', {
    version: Version.Version,
    parent: S.NullOr(
      S.suspend((): Hydra.Hydratable<S.Schema<Versioned, VersionedEncoded>, { keys: ['version'] }> => Versioned as any),
    ),
    revisions: S.Array(Revision.Revision),
    definition: SchemaDefinition.SchemaDefinition,
  }),
  { keys: ['version'] },
)

// ============================================================================
// Constructors
// ============================================================================

export const make = Versioned.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Versioned)

// ============================================================================
// Ordering
// ============================================================================

export const order: Order.Order<Versioned> = Order.mapInput(Version.order, (schema) => schema.version)

export const min = Order.min(order)
export const max = Order.max(order)
export const lessThan = Order.lessThan(order)
export const greaterThan = Order.greaterThan(order)

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(Versioned)
export const encode = S.encode(Versioned)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Versioned)
