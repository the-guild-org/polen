import type { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { LifecycleEvent } from '../lifecycle-event/$.js'

// ============================================================================
// Schema and Type
// ============================================================================

export interface ScalarType {
  readonly _tag: 'LifecycleScalarType'
  readonly name: string
  readonly events: ReadonlyArray<LifecycleEvent.LifecycleEvent>
}

export interface ScalarTypeEncoded extends
  ObjReplace<ScalarType, {
    readonly events: ReadonlyArray<EffectKit.Schema.ArgEncoded<typeof LifecycleEvent.LifecycleEvent>>
  }>
{}

const LifecycleEvents = S.Array(LifecycleEvent.LifecycleEvent)

export const ScalarTypeSchema = S.TaggedStruct('LifecycleScalarType', {
  name: S.String,
  events: LifecycleEvents,
})

export const ScalarType: S.Schema<ScalarType, ScalarTypeEncoded> = ScalarTypeSchema as any

// ============================================================================
// Constructors
// ============================================================================

export const make = (input: Omit<ScalarType, '_tag'>): ScalarType => ({
  _tag: 'LifecycleScalarType',
  ...input,
})

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(ScalarType)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(ScalarType)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(ScalarType)
export const decodeSync = S.decodeSync(ScalarType)
export const encode = S.encode(ScalarType)
