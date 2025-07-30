import type { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { LifecycleEvent } from '../lifecycle-event/$.js'

// ============================================================================
// Schema and Type
// ============================================================================

export interface FieldType {
  readonly _tag: 'LifecycleFieldType'
  readonly name: string
  readonly events: ReadonlyArray<LifecycleEvent.LifecycleEvent>
}

export interface FieldTypeEncoded extends
  ObjReplace<FieldType, {
    readonly events: ReadonlyArray<EffectKit.Schema.ArgEncoded<typeof LifecycleEvent.LifecycleEvent>>
  }>
{}

export const FieldTypeSchema = S.TaggedStruct('LifecycleFieldType', {
  name: S.String,
  events: S.Array(LifecycleEvent.LifecycleEvent),
})

export const FieldType: S.Schema<FieldType, FieldTypeEncoded> = FieldTypeSchema as any

// ============================================================================
// Constructors
// ============================================================================

export const make = (input: Omit<FieldType, '_tag'>): FieldType => ({
  _tag: 'LifecycleFieldType',
  ...input,
})

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(FieldType)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(FieldType)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(FieldType)
export const decodeSync = S.decodeSync(FieldType)
export const encode = S.encode(FieldType)
