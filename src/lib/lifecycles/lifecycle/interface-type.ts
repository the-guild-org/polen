import type { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { LifecycleEvents } from '#lib/lifecycles/lifecycle/_fragments'
import { LifecycleEvent } from '../lifecycle-event/$.js'
import * as FieldType from './field-type.js'

// ============================================================================
// Schema and Type
// ============================================================================

export interface InterfaceType {
  readonly _tag: 'LifecycleInterfaceType'
  readonly name: string
  readonly events: ReadonlyArray<LifecycleEvent.LifecycleEvent>
  readonly fields: Record<string, FieldType.FieldType>
}

export interface InterfaceTypeEncoded extends
  ObjReplace<InterfaceType, {
    readonly events: ReadonlyArray<EffectKit.Schema.ArgEncoded<typeof LifecycleEvent.LifecycleEvent>>
    readonly fields: Record<string, EffectKit.Schema.ArgEncoded<typeof FieldType.FieldTypeSchema>>
  }>
{}

export const InterfaceTypeSchema = S.TaggedStruct('LifecycleInterfaceType', {
  name: S.String,
  events: LifecycleEvents,
  fields: S.Record({ key: S.String, value: FieldType.FieldTypeSchema }),
})

export const InterfaceType: S.Schema<InterfaceType, InterfaceTypeEncoded> = InterfaceTypeSchema as any

// ============================================================================
// Constructors
// ============================================================================

export const make = (input: Omit<InterfaceType, '_tag'>): InterfaceType => ({
  _tag: 'LifecycleInterfaceType',
  ...input,
})

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(InterfaceType)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(InterfaceType)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(InterfaceType)
export const decodeSync = S.decodeSync(InterfaceType)
export const encode = S.encode(InterfaceType)
