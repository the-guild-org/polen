import type { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { LifecycleEvents } from '#lib/lifecycles/lifecycle/_fragments'
import { LifecycleEvent } from '../lifecycle-event/$.js'

// ============================================================================
// Schema and Type
// ============================================================================

export interface UnionType {
  readonly _tag: 'LifecycleUnionType'
  readonly name: string
  readonly events: ReadonlyArray<LifecycleEvent.LifecycleEvent>
}

export interface UnionTypeEncoded extends
  ObjReplace<UnionType, {
    readonly events: ReadonlyArray<EffectKit.Schema.ArgEncoded<typeof LifecycleEvent.LifecycleEvent>>
  }>
{}

export const UnionTypeSchema = S.TaggedStruct('LifecycleUnionType', {
  name: S.String,
  events: LifecycleEvents,
})

export const UnionType: S.Schema<UnionType, UnionTypeEncoded> = UnionTypeSchema as any

// ============================================================================
// Constructors
// ============================================================================

export const make = (input: Omit<UnionType, '_tag'>): UnionType => ({
  _tag: 'LifecycleUnionType',
  ...input,
})

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(UnionType)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(UnionType)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(UnionType)
export const decodeSync = S.decodeSync(UnionType)
export const encode = S.encode(UnionType)
