import { S } from '#lib/kit-temp/effect'
import { Version as VltVersion } from '@vltpkg/semver'

// ============================================================================
// Schema
// ============================================================================

export const OfficialRelease = S.TaggedStruct('SemverOfficialRelease', {
  major: S.Number,
  minor: S.Number,
  patch: S.Number,
  build: S.optional(S.Array(S.String)),
  version: S.instanceOf(VltVersion),
}).annotations({
  identifier: 'OfficialRelease',
  title: 'Official Release',
  description: 'A semantic version that is an official release (no pre-release identifiers)',
})

// ============================================================================
// Type
// ============================================================================

export type OfficialRelease = typeof OfficialRelease.Type

// ============================================================================
// Constructors
// ============================================================================

export const make = OfficialRelease.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(OfficialRelease)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(OfficialRelease)
export const decodeSync = S.decodeSync(OfficialRelease)
export const encode = S.encode(OfficialRelease)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(OfficialRelease)
