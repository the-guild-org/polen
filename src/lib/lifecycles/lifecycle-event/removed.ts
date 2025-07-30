import { S } from '#lib/kit-temp/effect'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'

// ============================================================================
// Schema and Type
// ============================================================================

export const Removed = S.TaggedStruct('LifecycleEventRemoved', {
  schema: Schema.Schema,
  revision: Revision.Revision,
})

export type Removed = S.Schema.Type<typeof Removed>

// ============================================================================
// Constructors
// ============================================================================

export const make = Removed.make

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Removed)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Removed)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Removed)
export const decodeSync = S.decodeSync(Removed)
export const encode = S.encode(Removed)
