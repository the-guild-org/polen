import { EffectKit } from '#lib/kit-temp'
import { S } from '#lib/kit-temp/effect'
import { Added } from './added.js'
import { Removed } from './removed.js'

// ============================================================================
// Schema
// ============================================================================

export const LifecycleEvent = S.Union(Added, Removed)

export type LifecycleEvent = S.Schema.Type<typeof LifecycleEvent>

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(LifecycleEvent)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(LifecycleEvent)
export const decodeSync = S.decodeSync(LifecycleEvent)
export const encode = S.encode(LifecycleEvent)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(LifecycleEvent)

// ============================================================================
// Factory
// ============================================================================

export const make = EffectKit.Schema.UnionAdt.makeMake(LifecycleEvent)
