import type { NonEmptyArray } from '#lib/kit-temp'
import type { FieldLifecycle, InputFieldLifecycle } from './FieldLifecycle.js'
import type { LifecycleEventBase } from './LifecycleEvent.js'

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
  kind: 'object'
  fields: Record<string, FieldLifecycle>
}

/**
 * Union type lifecycle (no fields)
 */
export interface UnionTypeLifecycle extends NamedTypeLifecycleBase {
  kind: 'union'
}

/**
 * Interface type lifecycle with fields
 */
export interface InterfaceTypeLifecycle extends NamedTypeLifecycleBase {
  kind: 'interface'
  fields: Record<string, FieldLifecycle>
}

/**
 * Enum type lifecycle (no values for now)
 */
export interface EnumTypeLifecycle extends NamedTypeLifecycleBase {
  kind: 'enum'
}

/**
 * Scalar type lifecycle (no fields or values)
 */
export interface ScalarTypeLifecycle extends NamedTypeLifecycleBase {
  kind: 'scalar'
}

/**
 * Input object type lifecycle with input fields
 */
export interface InputObjectTypeLifecycle extends NamedTypeLifecycleBase {
  kind: 'input_object'
  fields: Record<string, InputFieldLifecycle>
}

/**
 * Base interface for all named type lifecycles
 */
export interface NamedTypeLifecycleBase {
  name: string
  events: NonEmptyArray<LifecycleEventBase>
}
