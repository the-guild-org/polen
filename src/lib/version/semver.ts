import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema
// ============================================================================

export const Semver = S.TaggedStruct('VersionSemver', {
  value: S.String,
}).annotations({
  identifier: 'Semver',
  title: 'Semver',
  description: 'A semantic version following SemVer specification',
  adt: { name: 'Version' },
})

// ============================================================================
// Type
// ============================================================================

export type Semver = S.Schema.Type<typeof Semver>

// ============================================================================
// Constructors
// ============================================================================

export const make = Semver.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Semver)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Semver)
export const decodeSync = S.decodeSync(Semver)
export const encode = S.encode(Semver)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Semver)
