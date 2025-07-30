import type { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import { LifecycleEvent } from '../lifecycle-event/$.js'
import * as FieldType from './field-type.js'

// ============================================================================
// Schema and Type
// ============================================================================

export interface ObjectType {
  readonly _tag: 'LifecycleObjectType'
  readonly name: string
  readonly events: ReadonlyArray<LifecycleEvent.LifecycleEvent>
  readonly fields: Record<string, FieldType.FieldType>
}

export interface ObjectTypeEncoded extends
  ObjReplace<ObjectType, {
    readonly events: ReadonlyArray<EffectKit.Schema.ArgEncoded<typeof LifecycleEvent.LifecycleEvent>>
    readonly fields: Record<string, EffectKit.Schema.ArgEncoded<typeof FieldType.FieldTypeSchema>>
  }>
{}

const LifecycleEvents = S.Array(LifecycleEvent.LifecycleEvent)

export const ObjectTypeSchema = S.TaggedStruct('LifecycleObjectType', {
  name: S.String,
  events: LifecycleEvents,
  fields: S.Record({ key: S.String, value: FieldType.FieldTypeSchema }),
})

export const ObjectType: S.Schema<ObjectType, ObjectTypeEncoded> = ObjectTypeSchema as any

// ============================================================================
// Constructors
// ============================================================================

export const make = (input: Omit<ObjectType, '_tag'>): ObjectType => ({
  _tag: 'LifecycleObjectType',
  ...input,
})

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(ObjectType)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(ObjectType)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(ObjectType)
export const decodeSync = S.decodeSync(ObjectType)
export const encode = S.encode(ObjectType)
