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
export const hydrate = (value: unknown, index: Index.Index, parentUhl: Uhl.Uhl[] = []): unknown => {
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
    // Build UHL from dehydrated value
    const keys = Object.keys(value).filter(k => k !== '_tag' && k !== DEHYDRATED_PROPERTY_NAME)
    const uniqueKeys = Object.fromEntries(keys.map(k => [k, (value as any)[k]]).filter(([_, v]) => v != null))
    const segment = Uhl.Segment.make({ tag, uniqueKeys })
    const uhl = Uhl.make(segment)

    // Try with parent context first (for nested hydratables)
    if (parentUhl.length > 0) {
      const contextualUhl = [...parentUhl, ...uhl]
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
 * Encode a fragment for export. This encodes the value (handling transformations) but
 * keeps the fragment itself hydrated. Only nested hydratables are dehydrated.
 */
export const encodeFragmentForExport = <value>(value: value, context: Hydratable.Context): unknown => {
  // If this is a hydratable, we need to handle it specially
  if (EffectKit.Struct.isTagged(value) && !isDehydrated(value)) {
    const tag = (value as any)._tag
    const encoder = context.encoders.get(tag)
    if (encoder) {
      // First encode the value to handle transformations
      const encoded = encoder(value)

      // Now we need to handle nested hydratables in the encoded form
      // We can't use dehydrate_ on the encoded form because it might have different structure
      // Instead, we need to traverse the original value and encoded value in parallel

      if (typeof encoded === 'object' && encoded !== null && typeof value === 'object' && value !== null) {
        const result: any = { ...encoded }
        const visited = new WeakSet<object>()
        const graph = Graph.create()

        // For each property in the original value
        for (const [key, childValue] of Object.entries(value as any)) {
          if (key === '_tag') continue

          // Check if this child is a hydratable that needs dehydration
          if (
            childValue && typeof childValue === 'object'
            && EffectKit.Struct.isTagged(childValue) && !isDehydrated(childValue)
          ) {
            const childTag = childValue._tag
            const childAst = context.index.get(childTag)
            if (childAst) {
              // This is a nested hydratable - dehydrate it
              const dehydrateResult = dehydrate_(childValue, context, visited, graph)
              result[key] = dehydrateResult.value
            }
          }
          // Otherwise keep the encoded value as-is
        }

        return result
      }

      return encoded
    }
  }

  // Not a hydratable, just dehydrate normally
  return dehydrateWithContext(value, context)
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
      const isSingleton = Hydratable.isSingleton(ast)

      // First encode the value to get keys in encoded form
      const encoded = encoder(value) as Record<string, unknown>
      const result: any = { [EffectKit.Struct.tagPropertyName]: tag, [DEHYDRATED_PROPERTY_NAME]: true }

      // Handle singleton hydratables
      if (isSingleton) {
        // Get the schema for this hydratable
        const schema = S.make(ast)
        // Generate hash for the value
        const hash = Hydratable.generateSingletonHash(value, schema)
        result.hash = hash
      } else {
        // Add unique keys if any
        for (const key of keys) {
          if (key in encoded) {
            result[key] = encoded[key]
          }
        }
      }

      // Create UHL for this dehydrated value
      const uniqueKeys = isSingleton
        ? { hash: result.hash }
        : Object.fromEntries(keys.map(key => [key, encoded[key]]).filter(([_, v]) => v != null))

      const segment = Uhl.Segment.make({ tag, uniqueKeys })
      const uhl = Uhl.make(segment)

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
      const isSingleton = Hydratable.isSingleton(ast)
      const encoder = context.encoders.get(tag)
      if ((keys.length > 0 || isSingleton) && encoder) {
        const encoded = encoder(value) as Record<string, unknown>

        let uniqueKeys: Record<string, unknown>
        if (isSingleton) {
          // Get the schema for this hydratable
          const schema = S.make(ast)
          // Generate hash for the value
          const hash = Hydratable.generateSingletonHash(value, schema)
          uniqueKeys = { hash }
        } else {
          uniqueKeys = Object.fromEntries(keys.map(key => [key, encoded[key]]).filter(([_, v]) => v != null))
        }

        const segment = Uhl.Segment.make({ tag, uniqueKeys })
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
