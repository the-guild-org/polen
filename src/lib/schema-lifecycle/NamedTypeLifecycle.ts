import { Grafaid } from '#lib/grafaid'
import type { NonEmptyArray } from '#lib/kit-temp'
import type { FieldLifecycle, InputFieldLifecycle } from './FieldLifecycle.js'
import type { AddedEvent, LifecycleEventBase } from './LifecycleEvent.js'

/**
 * Union of all possible named type lifecycles
 */
export type NamedTypeLifecycle =
  | ObjectTypeLifecycle
  | UnionTypeLifecycle
  | InterfaceTypeLifecycle
  | EnumTypeLifecycle
  | ScalarTypeLifecycle
  | InputObjectTypeLifecycle

/**
 * Object type lifecycle with fields
 */
export interface ObjectTypeLifecycle extends NamedTypeLifecycleBase {
  kind: Grafaid.Schema.TypeKindName.Object
  fields: Record<string, FieldLifecycle>
}

/**
 * Union type lifecycle (no fields)
 */
export interface UnionTypeLifecycle extends NamedTypeLifecycleBase {
  kind: Grafaid.Schema.TypeKindName.Union
}

/**
 * Interface type lifecycle with fields
 */
export interface InterfaceTypeLifecycle extends NamedTypeLifecycleBase {
  kind: Grafaid.Schema.TypeKindName.Interface
  fields: Record<string, FieldLifecycle>
}

/**
 * Enum type lifecycle (no values for now)
 */
export interface EnumTypeLifecycle extends NamedTypeLifecycleBase {
  kind: Grafaid.Schema.TypeKindName.Enum
}

/**
 * Scalar type lifecycle (no fields or values)
 */
export interface ScalarTypeLifecycle extends NamedTypeLifecycleBase {
  kind: Grafaid.Schema.TypeKindName.Scalar
}

/**
 * Input object type lifecycle with input fields
 */
export interface InputObjectTypeLifecycle extends NamedTypeLifecycleBase {
  kind: Grafaid.Schema.TypeKindName.InputObject
  fields: Record<string, InputFieldLifecycle>
}

/**
 * Base interface for all named type lifecycles
 */
export interface NamedTypeLifecycleBase {
  name: string
  events: NonEmptyArray<LifecycleEventBase>
}

/**
 * Create a named type lifecycle with the correct type-specific structure
 */
export const createNamedTypeLifecycle = (
  typeName: string,
  kind: Grafaid.Schema.TypeKindName,
  addedEvent: AddedEvent,
): NamedTypeLifecycle => {
  const base = { name: typeName, events: [addedEvent] as NonEmptyArray<LifecycleEventBase> }

  switch (kind) {
    case Grafaid.Schema.TypeKindNameEnum.Object:
      return { ...base, kind, fields: {} } as ObjectTypeLifecycle
    case Grafaid.Schema.TypeKindNameEnum.Interface:
      return { ...base, kind, fields: {} } as InterfaceTypeLifecycle
    case Grafaid.Schema.TypeKindNameEnum.InputObject:
      return { ...base, kind, fields: {} } as InputObjectTypeLifecycle
    case Grafaid.Schema.TypeKindNameEnum.Union:
      return { ...base, kind } as UnionTypeLifecycle
    case Grafaid.Schema.TypeKindNameEnum.Enum:
      return { ...base, kind } as EnumTypeLifecycle
    case Grafaid.Schema.TypeKindNameEnum.Scalar:
      return { ...base, kind } as ScalarTypeLifecycle
    default:
      throw new Error(`Unknown type kind: ${kind}`)
  }
}
