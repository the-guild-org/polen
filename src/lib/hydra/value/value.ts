import type { Uhl } from '#lib/hydra/uhl/$'
import { S } from '#lib/kit-temp/effect'
import { EffectKit } from '#lib/kit-temp/effect'
import { Hydratable } from '../hydratable/$.js'

/**
 * Property name used to mark a value as dehydrated
 */
export const DEHYDRATED_PROPERTY_NAME = '_dehydrated' as const

/**
 * A hydratable candidate is a union of hydrated and dehydrated variants.
 *
 * @example
 * type UserHydratable = User | UserDehydrated
 */
export type Hydratable<
  $Hydrated = any,
  $Dehydrated extends { [DEHYDRATED_PROPERTY_NAME]: true } = { [DEHYDRATED_PROPERTY_NAME]: true },
> = $Hydrated | $Dehydrated

export type Value<$Tag extends string = string> = {
  _tag: $Tag
}

export type GetPickableUniqueKeys<$Value extends Value> = Exclude<keyof $Value, EffectKit.Struct.TagPropertyName>

/**
 * The dehydrated variant of a hydratable type
 */
export type Dehydrated = {
  [DEHYDRATED_PROPERTY_NAME]: true
}

/**
 * Check if a value is dehydrated
 */
export const isDehydrated = (value: unknown): value is Dehydrated => {
  return typeof value === 'object' && value !== null && DEHYDRATED_PROPERTY_NAME in value
    && value[DEHYDRATED_PROPERTY_NAME] === true
}

/**
 * Check if a value is hydrated (i.e., tagged but not dehydrated)
 */
export const isHydrated = (value: unknown): value is Value => {
  return EffectKit.Struct.isTagged(value) && !isDehydrated(value)
}

export interface Located {
  value: Hydratable
  uhl: Uhl.Uhl
}

/**
 * Extracts the dehydrated variant from a hydratable union.
 * Given a union like `User | UserDehydrated`, returns only `UserDehydrated`.
 */
export type ExtractDehydrated<$Value> = Extract<$Value, Dehydrated>

export type Dehydrate<
  $Value extends Value,
  $UniqueKeys extends GetPickableUniqueKeys<$Value>,
> = Pick<$Value, $UniqueKeys | EffectKit.Struct.TagPropertyName> & { [DEHYDRATED_PROPERTY_NAME]: true }

/**
 * Dehydrate a value based on a schema.
 * Finds all direct hydratables and dehydrates them.
 * Non-hydratable values are preserved with their hydratable children dehydrated.
 */
export const dehydrate = <schema extends S.Schema.Any>(schema: schema) => {
  const context = Hydratable.createContext(schema)

  return <value extends S.Schema.Type<schema>>(value: value): unknown => {
    const visited = new WeakSet<object>()
    return dehydrate_(value, context, visited)
  }
}

const dehydrate_ = (
  value: unknown,
  context: Hydratable.Context,
  visited: WeakSet<object>,
): unknown => {
  // Handle null/undefined
  if (value == null) return value

  // Handle objects
  if (typeof value === 'object') {
    // Check for circular references
    if (visited.has(value)) {
      // Return the object as-is to break the cycle
      return value
    }
    visited.add(value)

    // Check if this value itself is hydratable
    if (EffectKit.Struct.isTagged(value)) {
      const tag = value._tag
      const ast = context.index.get(tag)
      const encoder = context.encoders.get(tag)

      if (ast && encoder && !isDehydrated(value)) {
        // This is a hydratable that needs dehydration
        const keys = Hydratable.getHydrationKeys(ast, tag)
        if (keys.length > 0) {
          // First encode the value to get keys in encoded form
          const encoded = encoder(value) as Record<string, unknown>
          const result: any = { [EffectKit.Struct.tagPropertyName]: tag, [DEHYDRATED_PROPERTY_NAME]: true }
          for (const key of keys) {
            if (key in encoded) {
              result[key] = encoded[key]
            }
          }
          return result
        }
      }
    }

    // Traverse object/array to find child hydratables
    if (Array.isArray(value)) {
      return value.map(item => dehydrate_(item, context, visited))
    } else {
      const result: any = {}
      for (const [key, childValue] of Object.entries(value)) {
        result[key] = dehydrate_(childValue, context, visited)
      }
      return result
    }
  }

  // Primitives pass through
  return value
}
