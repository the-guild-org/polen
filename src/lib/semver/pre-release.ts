import { S } from '#lib/kit-temp/effect'
import { Version as VltVersion } from '@vltpkg/semver'

// ============================================================================
// Schema
// ============================================================================

export const PreRelease = S.TaggedStruct('SemverPreRelease', {
  major: S.Number,
  minor: S.Number,
  patch: S.Number,
  prerelease: S.NonEmptyArray(S.Union(S.String, S.Number)),
  build: S.optional(S.Array(S.String)),
  version: S.instanceOf(VltVersion),
}).annotations({
  identifier: 'PreRelease',
  title: 'Pre-Release',
  description: 'A semantic version with pre-release identifiers',
})

// ============================================================================
// Type
// ============================================================================

export type PreRelease = typeof PreRelease.Type

// ============================================================================
// Constructors
// ============================================================================

export const make = PreRelease.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(PreRelease)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(PreRelease)
export const decodeSync = S.decodeSync(PreRelease)
export const encode = S.encode(PreRelease)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(PreRelease)
