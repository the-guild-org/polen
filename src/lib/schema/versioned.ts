import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { Order } from 'effect'
import { Revision } from '../revision/$.js'
import { SchemaDefinition } from '../schema-definition/$.js'
import { Version } from '../version/$.js'

// ============================================================================
// Schema
// ============================================================================

export interface BranchPoint {
  readonly schema: Versioned
  readonly revision: Revision.Revision
}

export interface BranchPointEncoded {
  readonly schema: VersionedEncoded
  readonly revision: Revision.Revision
}

export interface Versioned {
  readonly _tag: 'SchemaVersioned'
  readonly version: Version.Version
  readonly branchPoint: BranchPoint | null
  readonly revisions: ReadonlyArray<Revision.Revision>
  readonly definition: SchemaDefinition.SchemaDefinition
  readonly categories: ReadonlyArray<{ readonly name: string; readonly types: ReadonlyArray<string> }>
}

export interface VersionedEncoded extends
  ObjReplace<Versioned, {
    readonly version: S.Schema.Encoded<typeof Version.Version>
    readonly branchPoint: BranchPointEncoded | null
    readonly revisions: ReadonlyArray<S.Schema.Encoded<typeof Revision.Revision>>
    readonly definition: S.Schema.Encoded<typeof SchemaDefinition.SchemaDefinition>
  }>
{}

export const Versioned = S.TaggedStruct('SchemaVersioned', {
  version: Version.Version,
  branchPoint: S.NullOr(S.Struct({
    schema: S.suspend((): S.Schema<Versioned, VersionedEncoded> => Versioned as any),
    revision: Revision.Revision,
  })),
  revisions: S.Array(Revision.Revision),
  definition: SchemaDefinition.SchemaDefinition,
  categories: S.optionalWith(
    S.Array(S.Struct({
      name: S.String,
      types: S.Array(S.String),
    })),
    { default: () => [] },
  ),
})

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
