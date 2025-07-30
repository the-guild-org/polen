import { S } from '#lib/kit-temp/effect'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'

// ============================================================================
// Schema and Type
// ============================================================================

export const Added = S.TaggedStruct('LifecycleEventAdded', {
  schema: Schema.Schema,
  revision: Revision.Revision,
})

export type Added = S.Schema.Type<typeof Added>

// ============================================================================
// Constructors
// ============================================================================

export const make = Added.make

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Added)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Added)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Added)
export const decodeSync = S.decodeSync(Added)
export const encode = S.encode(Added)
