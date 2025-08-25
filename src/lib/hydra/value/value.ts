import { Graph } from '#lib/graph/$'
import type { Index } from '#lib/hydra/index/$'
import { Uhl } from '#lib/hydra/uhl/$'
import { S } from '#lib/kit-temp/effect'
import { EffectKit } from '#lib/kit-temp/effect'
import type { Config, Context } from '../hydratable/hydratable.js'
import { createContext, generateSingletonHash, getHydrationKeys, isSingleton } from '../hydratable/hydratable.js'

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
  $Hydrated = { _tag: string },
  $Dehydrated extends { _tag: string; [DEHYDRATED_PROPERTY_NAME]: true } = {
    _tag: string
    [DEHYDRATED_PROPERTY_NAME]: true
  },
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
export const hydrate = (value: unknown, index: Index.Index, parentUhl: Uhl.Uhl = Uhl.makeRoot()): unknown => {
  // Handle null/undefined
  if (value == null) {
    return value
  }

  // Handle non-objects
  if (typeof value !== 'object') {
    return value
  }

  // If it's a dehydrated value, look it up and hydrate
  if (isDehydrated(value)) {
    const tag = (value as any)._tag
    // Build UHL from dehydrated value - only include primitive values as unique keys
    const keys = Object.keys(value).filter(k => k !== '_tag' && k !== DEHYDRATED_PROPERTY_NAME)
    const uniqueKeys = Object.fromEntries(
      keys.map(k => [k, (value as any)[k]])
        .filter(([_, v]) => v != null && (typeof v === 'string' || typeof v === 'number')),
    )
    const segment = Uhl.Segment.make({ tag, uniqueKeys })
    const uhl = Uhl.make(segment)

    // Try with parent context first (for nested hydratables)
    if (parentUhl._tag === 'UhlPath') {
      // Combine parent path with current UHL
      let contextualUhl: Uhl.Uhl
      if (uhl._tag === 'UhlRoot') {
        contextualUhl = parentUhl
      } else {
        const parentSegments = parentUhl._tag === 'UhlPath' ? parentUhl.segments : []
        const uhlSegments = uhl._tag === 'UhlPath' ? uhl.segments : []
        contextualUhl = Uhl.makePath(...parentSegments, ...uhlSegments)
      }

      const contextualUhlString = Uhl.toString(contextualUhl)
      const hydratedValue = index.fragments.get(contextualUhlString)
      if (hydratedValue && !isDehydrated(hydratedValue)) {
        // Recursively hydrate the replacement value with its own UHL as context
        return hydrate(hydratedValue, index, contextualUhl)
      }
    }

    // Try without context (for root-level hydratables)
    const uhlString = Uhl.toString(uhl)
    const hydratedValue = index.fragments.get(uhlString)
    if (hydratedValue && !isDehydrated(hydratedValue)) {
      // Recursively hydrate the replacement value
      return hydrate(hydratedValue, index, uhl)
    }

    // If not found in index, return the dehydrated value as-is
    return value
  }

  // For hydrated hydratables, we need to determine their UHL for context
  let currentUhl = parentUhl
  if (is(value) && !isDehydrated(value)) {
    // This is a hydrated hydratable - we need to find its UHL in the index
    // by matching the value
    for (const [uhlString, fragmentValue] of index.fragments.entries()) {
      if (fragmentValue === value) {
        currentUhl = Uhl.fromString(uhlString)
        break
      }
    }
  }

  // Recursively hydrate arrays
  if (Array.isArray(value)) {
    return value.map(item => hydrate(item, index, currentUhl))
  }

  // Recursively hydrate objects
  const result: any = {}
  for (const [key, childValue] of Object.entries(value)) {
    result[key] = hydrate(childValue, index, currentUhl)
  }
  return result
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

// /**
//  * Dehydrate a value and collect dependencies.
//  * Returns both the dehydrated value and a dependency graph.
//  */
// export const dehydrateWithDependencies = <schema extends S.Schema.Any>(schema: schema) => {
//   return dehydrateWithDependenciesAndContext.bind(null, createContext(schema))
// }

/**
 * Dehydrate a value and collect dependencies using a pre-created context (for performance).
 * Returns both the dehydrated value and a dependency graph.
 */
export const dehydrateWithDependencies = <value>(
  value: value,
  context: Context,
): DehydrateResult => {
  const visited = new WeakSet<object>()
  const graph = Graph.create()
  const result = _dehydrateFromContext(value, context, visited, graph)
  return {
    value: result.value,
    graph,
  }
}

interface DehydrateState {
  value: unknown
  uhl?: Uhl.Uhl
}

/**
 * Create a dehydrated value from a hydratable schema configuration
 * This is the runtime implementation for the makeDehydrated schema method
 */
export const makeDehydratedValue = (
  config: Config,
  schema: S.Schema.Any,
  keys?: any,
): any => {
  if (config._tag === 'HydratableConfigSingleton') {
    // For singletons, we can't generate a hash without the actual value
    // makeDehydrated() should not be used for singletons without a value
    throw new Error('Singleton hydratables require a value to generate the hash. Use dehydrate() instead.')
  }

  if (config._tag === 'HydratableConfigStruct') {
    return {
      _tag: EffectKit.Schema.TaggedStruct.getTagOrThrow(schema),
      _dehydrated: true,
      ...keys,
    }
  }

  throw new Error('ADT dehydration not yet implemented')
}

/**
 * Dehydrate a value based on a schema.
 * Finds all direct hydratables and dehydrates them.
 * Non-hydratable values are preserved with their hydratable children dehydrated.
 */
export const dehydrate =
  <schema extends S.Schema.Any>(schema: schema) => <value extends S.Schema.Type<schema>>(value: value): unknown => {
    const context = createContext(schema)
    return (value: any) => {
      return dehydrateFromContext(value, context)
    }
  }

/**
 * Dehydrate a value using a pre-created context (for performance).
 */
export const dehydrateFromContext = <value>(value: value, context: Context): unknown => {
  const visited = new WeakSet<object>()
  const graph = Graph.create()
  const result = _dehydrateFromContext(value, context, visited, graph)
  return result.value
}

const _dehydrateFromContext = (
  value: unknown,
  context: Context,
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
    const ast = context.astIndex.get(tag)
    const encoder = context.encodersIndex.get(tag)

    if (ast && encoder && !isDehydrated(value)) {
      // This is a hydratable that needs dehydration
      const keys = getHydrationKeys(ast, tag)
      const isS = isSingleton(ast)

      // First encode the value to get keys in encoded form
      // Handle case where value contains dehydrated references - use try/catch
      let encoded: Record<string, unknown>
      try {
        encoded = encoder(value) as Record<string, unknown>
      } catch (error) {
        // Check if the error is due to dehydrated references in the value
        // Only use fallback if the value contains dehydrated objects
        const hasDehydratedReferences = Object.values(value as any).some(v =>
          v != null && typeof v === 'object' && isDehydrated(v)
        )

        if (hasDehydratedReferences) {
          // If encoding fails due to dehydrated references, skip encoding and use raw value
          // This happens when a hydrated value contains dehydrated references in its fields
          encoded = value as Record<string, unknown>
        } else {
          // Re-throw the original error if it's not due to dehydrated references
          throw error
        }
      }
      const result: any = { [EffectKit.Struct.tagPropertyName]: tag, [DEHYDRATED_PROPERTY_NAME]: true }

      // Handle singleton hydratables
      if (isS) {
        // Get the schema for this hydratable
        const schema = S.make(ast)
        // Generate hash for the value
        const hash = generateSingletonHash(value, schema)
        result.hash = hash
      } else {
        // Add unique keys if any
        for (const key of keys) {
          if (key in encoded) {
            result[key] = encoded[key]
          }
        }

        // For nested hydratables, we need to include them in dehydrated form
        // But we should NOT include all other properties - only nested hydratables
        for (const [key, childValue] of Object.entries(value as any)) {
          if (key === '_tag' || keys.includes(key)) continue // Skip tag and unique keys (already handled)

          // Only include nested hydratables, not all properties
          if (
            childValue && typeof childValue === 'object' && EffectKit.Struct.isTagged(childValue)
            && !isDehydrated(childValue)
          ) {
            const childTag = childValue._tag
            const childAst = context.astIndex.get(childTag)
            if (childAst) {
              // This is a nested hydratable - dehydrate it recursively
              const childResult = _dehydrateFromContext(childValue, context, visited, graph, parentUhl)
              result[key] = childResult.value
            }
            // If it's tagged but not hydratable, don't include it unless it's a unique key
          }
          // Don't include non-hydratable properties - they're not part of the dehydrated form
        }
      }

      // Create UHL for this dehydrated value
      const uniqueKeys = isS
        ? { hash: result.hash }
        : Object.fromEntries(keys.map(key => [key, encoded[key]]).filter(([_, v]) => v != null))

      const segment = Uhl.Segment.make({ tag, uniqueKeys })
      const uhl = Uhl.makePath(segment)

      // Add dependency if we have a parent
      if (parentUhl) {
        Graph.addDependencyMutable(graph, Uhl.toString(parentUhl), Uhl.toString(uhl))
      }

      return { value: result, uhl }
    }
  }

  // Traverse object/array to find child hydratables
  if (Array.isArray(value)) {
    const result = value.map(item => {
      const childResult = _dehydrateFromContext(item, context, visited, graph, parentUhl)
      return childResult.value
    })
    return { value: result }
  }

  // Check if this object has a UHL (is it a hydrated hydratable?)
  const result: any = {}
  let currentUhl = parentUhl
  if (EffectKit.Struct.isTagged(value) && !isDehydrated(value)) {
    const tag = value._tag
    const ast = context.astIndex.get(tag)
    if (ast) {
      // This is a hydrated hydratable - create its UHL
      const keys = getHydrationKeys(ast, tag)
      const isS = isSingleton(ast)
      const encoder = context.encodersIndex.get(tag)
      if ((keys.length > 0 || isS) && encoder) {
        const encoded = encoder(value) as Record<string, unknown>

        let uniqueKeys: Record<string, unknown>
        if (isS) {
          // Get the schema for this hydratable
          const schema = S.make(ast)
          // Generate hash for the value
          const hash = generateSingletonHash(value, schema)
          uniqueKeys = { hash }
        } else {
          uniqueKeys = Object.fromEntries(keys.map(key => [key, encoded[key]]).filter(([_, v]) => v != null))
        }

        const segment = Uhl.Segment.make({ tag, uniqueKeys: uniqueKeys as any })
        currentUhl = Uhl.make(segment)
      }
    }
  }

  for (const [key, childValue] of Object.entries(value)) {
    const childResult = _dehydrateFromContext(childValue, context, visited, graph, currentUhl)
    result[key] = childResult.value
  }
  return { value: result }
}
