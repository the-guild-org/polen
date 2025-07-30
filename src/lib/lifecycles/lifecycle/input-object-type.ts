import type { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { LifecycleEvent } from '../lifecycle-event/$.js'
import * as FieldType from './field-type.js'

// ============================================================================
// Schema and Type
// ============================================================================

export interface InputObjectType {
  readonly _tag: 'LifecycleInputObjectType'
  readonly name: string
  readonly events: ReadonlyArray<LifecycleEvent.LifecycleEvent>
  readonly fields: Record<string, FieldType.FieldType>
}

export interface InputObjectTypeEncoded extends
  ObjReplace<InputObjectType, {
    readonly events: ReadonlyArray<EffectKit.Schema.ArgEncoded<typeof LifecycleEvent.LifecycleEvent>>
    readonly fields: Record<string, EffectKit.Schema.ArgEncoded<typeof FieldType.FieldTypeSchema>>
  }>
{}

const LifecycleEvents = S.Array(LifecycleEvent.LifecycleEvent)

export const InputObjectTypeSchema = S.TaggedStruct('LifecycleInputObjectType', {
  name: S.String,
  events: LifecycleEvents,
  fields: S.Record({ key: S.String, value: FieldType.FieldTypeSchema }),
})

export const InputObjectType: S.Schema<InputObjectType, InputObjectTypeEncoded> = InputObjectTypeSchema as any

// ============================================================================
// Constructors
// ============================================================================

export const make = (input: Omit<InputObjectType, '_tag'>): InputObjectType => ({
  _tag: 'LifecycleInputObjectType',
  ...input,
})

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(InputObjectType)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(InputObjectType)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(InputObjectType)
export const decodeSync = S.decodeSync(InputObjectType)
export const encode = S.encode(InputObjectType)
