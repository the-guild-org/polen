import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema
// ============================================================================

export const Integer = S.TaggedStruct('VersionInteger', {
  value: S.Number,
}).annotations({
  identifier: 'Integer',
  title: 'Integer',
  description: 'An integer-based version number (e.g., 1, 2, 3)',
  adt: { name: 'Version' },
})

// ============================================================================
// Type
// ============================================================================

export type Integer = S.Schema.Type<typeof Integer>

// ============================================================================
// Constructors
// ============================================================================

export const make = Integer.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Integer)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Integer)
export const decodeSync = S.decodeSync(Integer)
export const encode = S.encode(Integer)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Integer)
