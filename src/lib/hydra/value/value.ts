import type { UHL } from '#lib/hydra/uhl/$'
import type { ExtractDehydrated } from '#lib/hydra/value/dehydrate'
import type { ExtractHydrated } from '#lib/hydra/value/hydrate'
import { EffectKit } from '#lib/kit-temp/effect'

export * from './hydrate.js'
export * from './dehydrate.js'

/**
 * A hydratable candidate is a union of hydrated and dehydrated variants.
 *
 * @example
 * type UserHydratable = User | UserDehydrated
 */
export type Hydratable<
  $Hydrated = any,
  $Dehydrated extends { _dehydrated: true } = { _dehydrated: true },
> = $Hydrated | $Dehydrated

/**
 * Checks if a type is a hydratable union (has both hydrated and dehydrated variants)
 */
export type IsHydratable<$Value> = Exclude<$Value, { _dehydrated: true }> extends never ? false
  : Extract<$Value, { _dehydrated: true }> extends never ? false
  : true

export type Value<$Tag extends string = string> = {
  _tag: $Tag
}

export type GetPickableUniqueKeys<$Value extends Value> = Exclude<keyof $Value, EffectKit.Struct.TagPropertyName>

/**
 * The dehydrated variant of a hydratable type
 */
export type Dehydrated = {
  _dehydrated: true
}

// ============================================================================
// Runtime Functions
// ============================================================================

/**
 * Type for shallow hydration check functions
 */
export type FnIsHydratedShallow = <value_>(value: value_) => value is ExtractHydrated<value_>

/**
 * Type for shallow dehydration check functions
 */
export type FnIsDehydratedShallow = <value_>(value: value_) => value is ExtractDehydrated<value_>

/**
 * Checks if a value is hydrated at the shallow level (not dehydrated)
 * @param value The value to check
 */
// @ts-expect-error
export const isHydratedShallow: FnIsHydratedShallow = (value) => {
  if (typeof value !== 'object' || value === null) return false
  return !('_dehydrated' in value && value._dehydrated === true)
}

/**
 * Checks if a value is dehydrated at the shallow level
 * @param value The value to check
 */
// @ts-expect-error
export const isDehydratedShallow: FnIsDehydratedShallow = (value) => {
  if (typeof value !== 'object' || value === null) return false
  return '_dehydrated' in value && value._dehydrated === true
}

/**
 * Type for makeDehydrated functions
 * @template $Value The dehydrated type (only contains the dehydrated fields)
 * @template $Result The result type (dehydrated with tag)
 */
export type FnMakeDehydrated<$Value, $Result> = (fields: Omit<$Value, '_tag'>) => $Result

/**
 * Creates a factory function for making dehydrated values
 */
export const deriveMakeDehydrated =
  () => <T extends Record<PropertyKey, any>>(fields: T): T & { _dehydrated: true } => {
    return {
      ...fields,
      _dehydrated: true,
    } as any
  }

export interface Located {
  value: Hydratable
  uhl: UHL.UHL
}
