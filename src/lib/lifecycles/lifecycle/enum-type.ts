import type { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { LifecycleEvents } from '#lib/lifecycles/lifecycle/_fragments'
import { LifecycleEvent } from '../lifecycle-event/$.js'

// ============================================================================
// Schema and Type
// ============================================================================

export interface EnumType {
  readonly _tag: 'LifecycleEnumType'
  readonly name: string
  readonly events: ReadonlyArray<LifecycleEvent.LifecycleEvent>
}

export interface EnumTypeEncoded extends
  ObjReplace<EnumType, {
    readonly events: ReadonlyArray<EffectKit.Schema.ArgEncoded<typeof LifecycleEvent.LifecycleEvent>>
  }>
{}

export const EnumTypeSchema = S.TaggedStruct('LifecycleEnumType', {
  name: S.String,
  events: LifecycleEvents,
})

export const EnumType: S.Schema<EnumType, EnumTypeEncoded> = EnumTypeSchema as any

// ============================================================================
// Constructors
// ============================================================================

export const make = (input: Omit<EnumType, '_tag'>): EnumType => ({
  _tag: 'LifecycleEnumType',
  ...input,
})

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(EnumType)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(EnumType)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(EnumType)
export const decodeSync = S.decodeSync(EnumType)
export const encode = S.encode(EnumType)
