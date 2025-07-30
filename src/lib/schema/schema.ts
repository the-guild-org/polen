import { S } from '#lib/kit-temp/effect'
import * as Unversioned from './unversioned.js'
import * as Versioned from './versioned.js'

// ============================================================================
// Members
// ============================================================================

export * as Unversioned from './unversioned.js'
export * as Versioned from './versioned.js'

// ============================================================================
// Schema
// ============================================================================

export const Schema = S.Union(Versioned.Versioned, Unversioned.Unversioned)

export type Schema = S.Schema.Type<typeof Schema>

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Schema)

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(Schema)
export const encode = S.encode(Schema)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Schema)
