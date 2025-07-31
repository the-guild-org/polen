import { Graph } from '#lib/graph/$'
import type { Index } from '#lib/hydra/index/$'
import { Uhl } from '#lib/hydra/uhl/$'
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

// todo: use generic taggedstruct type
export type Value<$Tag extends string = string> = {
  _tag: $Tag
}

/**
 * Check if a value is a tagged struct
 */
export const is = (value: unknown): value is Value => {
  return EffectKit.Struct.isTagged(value)
}

export type GetPickableUniqueKeys<$Value extends Value> = Exclude<keyof $Value, EffectKit.Struct.TagPropertyName>

/**
 * Hydrate a value by replacing dehydrated references with actual values from the index.
 */
export const hydrate = (value: Value, index: Index.Index): unknown => {
  if (isDehydrated(value)) {
    const tag = value._tag
    // Build UHL from dehydrated value
    const keys = Object.keys(value).filter(k => k !== '_tag' && k !== DEHYDRATED_PROPERTY_NAME)
    const segments = keys.map(k => (value as any)[k]).filter(v => v != null)
    const segment = Uhl.Segment.make({
      tag,
      uniqueKeys: Object.fromEntries(keys.map((k, i) => [k, segments[i]]).filter(([_, v]) => v != null)),
    })
    const uhl = Uhl.make(segment)
    const uhlString = Uhl.toString(uhl)

    // Look up in index
    const hydratedValue = index.fragments.get(uhlString)
    if (hydratedValue) {
      // Recursively hydrate the replacement value
      return hydrate(hydratedValue, index)
    }
  }

  // Recursively hydrate object/array
  if (Array.isArray(value)) {
    return value.map(item => is(item) ? hydrate(item, index) : item)
  } else {
    const result: any = {}
    for (const [key, childValue] of Object.entries(value)) {
      result[key] = is(childValue) ? hydrate(childValue, index) : childValue
    }
    return result
  }
}

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
 * Result of dehydration including the dehydrated value and dependency graph
 */
export interface DehydrateResult {
  value: unknown
  graph: Graph.DependencyGraph
}

/**
 * Dehydrate a value based on a schema.
 * Finds all direct hydratables and dehydrates them.
 * Non-hydratable values are preserved with their hydratable children dehydrated.
 */
export const dehydrate = <schema extends S.Schema.Any>(schema: schema) => {
  const context = Hydratable.createContext(schema)
  return <value extends S.Schema.Type<schema>>(value: value): unknown => {
    return dehydrateWithContext(value, context)
  }
}

/**
 * Dehydrate a value using a pre-created context (for performance).
 */
export const dehydrateWithContext = <value>(value: value, context: Hydratable.Context): unknown => {
  const visited = new WeakSet<object>()
  const graph = Graph.create()
  const result = dehydrate_(value, context, visited, graph)
  return result.value
}

/**
 * Dehydrate a value and collect dependencies.
 * Returns both the dehydrated value and a dependency graph.
 */
export const dehydrateWithDependencies = <schema extends S.Schema.Any>(schema: schema) => {
  const context = Hydratable.createContext(schema)

  return <value extends S.Schema.Type<schema>>(value: value): DehydrateResult => {
    const visited = new WeakSet<object>()
    const graph = Graph.create()
    const result = dehydrate_(value, context, visited, graph)
    return { value: result.value, graph }
  }
}

/**
 * Dehydrate a value and collect dependencies using a pre-created context (for performance).
 * Returns both the dehydrated value and a dependency graph.
 */
export const dehydrateWithDependenciesAndContext = <value>(
  value: value,
  context: Hydratable.Context,
): DehydrateResult => {
  const visited = new WeakSet<object>()
  const graph = Graph.create()
  const result = dehydrate_(value, context, visited, graph)
  return { value: result.value, graph }
}

interface DehydrateState {
  value: unknown
  uhl?: Uhl.Uhl
}

const dehydrate_ = (
  value: unknown,
  context: Hydratable.Context,
  visited: WeakSet<object>,
  graph: Graph.DependencyGraph,
  parentUhl?: Uhl.Uhl,
): DehydrateState => {
  // Handle null/undefined
  if (value == null) {
    return { value }
  }

  // Primitives pass through
  if (typeof value !== 'object') {
    return { value }
  }

  // Handle objects

  // Check for circular references
  if (visited.has(value)) {
    // Return the object as-is to break the cycle
    return { value }
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

        // Create UHL for this dehydrated value
        const segments = keys.map(key => encoded[key]).filter(v => v != null)
        const segment = Uhl.Segment.make({
          tag,
          uniqueKeys: Object.fromEntries(keys.map((key, i) => [key, segments[i]]).filter(([_, v]) => v != null)),
        })
        const uhl = Uhl.make(segment)

        // Add dependency if we have a parent
        if (parentUhl) {
          Graph.addDependencyMutable(graph, Uhl.toString(parentUhl), Uhl.toString(uhl))
        }

        return { value: result, uhl }
      }
    }
  }

  // Traverse object/array to find child hydratables
  if (Array.isArray(value)) {
    const result = value.map(item => {
      const childResult = dehydrate_(item, context, visited, graph, parentUhl)
      return childResult.value
    })
    return { value: result }
  }

  // Check if this object has a UHL (is it a hydrated hydratable?)
  const result: any = {}
  let currentUhl = parentUhl
  if (EffectKit.Struct.isTagged(value) && !isDehydrated(value)) {
    const tag = value._tag
    const ast = context.index.get(tag)
    if (ast) {
      // This is a hydrated hydratable - create its UHL
      const keys = Hydratable.getHydrationKeys(ast, tag)
      const encoder = context.encoders.get(tag)
      if (keys.length > 0 && encoder) {
        const encoded = encoder(value) as Record<string, unknown>
        const segments = keys.map(key => encoded[key]).filter(v => v != null)
        const segment = Uhl.Segment.make({
          tag,
          uniqueKeys: Object.fromEntries(keys.map((key, i) => [key, segments[i]]).filter(([_, v]) => v != null)),
        })
        currentUhl = Uhl.make(segment)
      }
    }
  }

  for (const [key, childValue] of Object.entries(value)) {
    const childResult = dehydrate_(childValue, context, visited, graph, currentUhl)
    result[key] = childResult.value
  }
  return { value: result }
}
