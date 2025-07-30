import type { Dehydrated } from '#lib/hydra/value/value'
import { S } from '#lib/kit-temp/effect'
import { Schema } from '../schema/$.js'
import { buildHydratableRegistry, type HydratableRegistry } from '../schema/hydratable-registry.js'

/**
 * Extracts the hydrated variant from a hydratable union.
 * Given a union like `User | UserDehydrated`, returns only `User`.
 */
export type ExtractHydrated<$Value> = Exclude<$Value, Dehydrated>

/**
 * Type for a hydrate function
 */
export type FnHydrate<$Schema extends Schema.Base> = <value extends S.Schema.Type<$Schema>>(
  value: value,
  getHydratable: (tag: string, uniqueKeys: Record<string, unknown>) => unknown | undefined,
) => unknown

/**
 * Creates a hydrate function for a specific schema.
 * The hydrate function recursively hydrates all dehydrated values in a structure.
 *
 * @param schema - The schema to create a hydrate function for
 * @returns A function that hydrates values based on the schema
 */
export const hydrate = <schema extends S.Schema.Any>(schema: schema): FnHydrate<schema> => {
  // Build registry once for this schema
  const registry = buildHydratableRegistry(schema)

  return <value extends S.Schema.Type<schema>>(
    value: value,
    getHydratable: (tag: string, uniqueKeys: Record<string, unknown>) => unknown | undefined,
  ): unknown => {
    return hydrateValue(value, registry, getHydratable)
  }
}

/**
 * Recursively hydrates a value
 */
const hydrateValue = (
  value: unknown,
  registry: HydratableRegistry,
  getHydratable: (tag: string, uniqueKeys: Record<string, unknown>) => unknown | undefined,
): unknown => {
  // Handle null/undefined
  if (value == null) return value

  // Handle objects
  if (typeof value === 'object') {
    // Check if this value is dehydrated
    if ('_tag' in value && typeof value._tag === 'string' && '_dehydrated' in value && value._dehydrated === true) {
      const tag = value._tag

      // Check if this is a registered hydratable
      if (registry[tag]) {
        // Extract unique keys (all keys except _tag and _dehydrated)
        const uniqueKeys: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(value)) {
          if (key !== '_tag' && key !== '_dehydrated') {
            uniqueKeys[key] = val
          }
        }

        // Try to get the hydrated version
        const hydrated = getHydratable(tag, uniqueKeys)
        if (hydrated !== undefined) {
          // Recursively hydrate the hydrated value's children
          return hydrateValue(hydrated, registry, getHydratable)
        }
      }
    }

    // Traverse object/array to hydrate children
    if (Array.isArray(value)) {
      return value.map(item => hydrateValue(item, registry, getHydratable))
    } else {
      const result: any = {}
      for (const [key, childValue] of Object.entries(value)) {
        result[key] = hydrateValue(childValue, registry, getHydratable)
      }
      return result
    }
  }

  // Primitives pass through
  return value
}
