import type { NonEmptyArray } from '#lib/kit-temp'
import type { LifecycleEventBase } from './LifecycleEvent.js'

/**
 * Field lifecycle for object and interface types
 */
export interface FieldLifecycle {
  name: string
  events: NonEmptyArray<LifecycleEventBase>
}

/**
 * Input field lifecycle for input object types
 */
export interface InputFieldLifecycle {
  name: string
  events: NonEmptyArray<LifecycleEventBase>
}
