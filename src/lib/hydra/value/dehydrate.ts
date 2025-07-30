import type { GetPickableKeys } from '#lib/hydra/schema/schema'
import type { Dehydrated, GetPickableUniqueKeys, Value } from '#lib/hydra/value/value'
import { S } from '#lib/kit-temp/effect'
import { Obj } from '@wollybeard/kit'
import { getHydrationKeys } from '../hydratable.js'
import { Schema } from '../schema/$.js'
import { buildHydratableRegistry, type HydratableRegistry } from '../schema/hydratable-registry.js'

export type FnDehydrate<
  $Schema extends Schema.Base,
  $UniqueKeys extends GetPickableKeys<$Schema>,
> = <value extends S.Schema.Type<$Schema>>(
  value: value,
) => Dehydrate<value, $UniqueKeys>

/**
 * Extracts the dehydrated variant from a hydratable union.
 * Given a union like `User | UserDehydrated`, returns only `UserDehydrated`.
 */
export type ExtractDehydrated<$Value> = Extract<$Value, Dehydrated>

export type Dehydrate<
  $Value extends Value,
  $UniqueKeys extends GetPickableUniqueKeys<$Value>,
> = Pick<$Value, $UniqueKeys | '_tag'> & { _dehydrated: true }

/**
 * Creates a dehydrate function for a specific set of keys
 */
export const makeDehydrator = <uniqueKeys extends ReadonlyArray<PropertyKey>>(uniqueKeys: uniqueKeys) => {
  return <value extends Record<PropertyKey, any>>(value: value): any => {
    const valueDehydrated: any = {
      _tag: (value as any)._tag,
      ...Obj.pick(value, uniqueKeys),
      _dehydrated: true,
    }

    return valueDehydrated
  }
}

/**
 * Dehydrate a value based on a schema.
 * Finds all direct hydratables and dehydrates them.
 * Non-hydratable values are preserved with their hydratable children dehydrated.
 */
export const dehydrate = <schema extends S.Schema.Any>(schema: schema) => {
  // Build tree and registry once for this schema
  const tree = Schema.buildHydratablesPathsTree(schema.ast)
  const registry = buildHydratableRegistry(schema)

  return <value extends S.Schema.Type<schema>>(value: value): unknown => {
    return dehydrateValue(value, registry)
  }
}

const dehydrateValue = (value: unknown, registry: HydratableRegistry): unknown => {
  // Handle null/undefined
  if (value == null) return value

  // Handle objects
  if (typeof value === 'object') {
    // Check if this value itself is hydratable
    if ('_tag' in value && typeof value._tag === 'string') {
      const tag = value._tag
      const schema = registry[tag]

      if (schema && !('_dehydrated' in value && value._dehydrated === true)) {
        // This is a hydratable that needs dehydration
        const keys = getHydrationKeys(schema, tag)
        if (keys.length > 0) {
          // For hydratable schemas, we just need to copy the keys directly
          // The values should already be in their encoded form
          const result: any = { _tag: tag, _dehydrated: true }
          for (const key of keys) {
            if (key in value) {
              result[key] = (value as any)[key]
            }
          }
          return result
        }
      }
    }

    // Traverse object/array to find child hydratables
    if (Array.isArray(value)) {
      return value.map(item => dehydrateValue(item, registry))
    } else {
      const result: any = {}
      for (const [key, childValue] of Object.entries(value)) {
        result[key] = dehydrateValue(childValue, registry)
      }
      return result
    }
  }

  // Primitives pass through
  return value
}
