import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema
// ============================================================================

export const Custom = S.TaggedStruct('VersionCustom', {
  value: S.String,
}).annotations({
  identifier: 'Custom',
  title: 'Custom',
  description: 'A custom version string with arbitrary format',
  adt: { name: 'Version' },
})

// ============================================================================
// Type
// ============================================================================

export type Custom = S.Schema.Type<typeof Custom>

// ============================================================================
// Constructors
// ============================================================================

export const make = Custom.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Custom)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Custom)
export const decodeSync = S.decodeSync(Custom)
export const encode = S.encode(Custom)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Custom)
