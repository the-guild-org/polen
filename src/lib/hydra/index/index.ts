import { Graph } from '#lib/graph/$'
import { type Fragment, fragmentsFromRootValue } from '#lib/hydra/fragment'
import { EffectKit } from '#lib/kit-temp/effect'
import { zd } from '#lib/kit-temp/other'
import { type FragmentAsset, fragmentAssetToFragment } from '../fragment-asset.js'
import { Hydratable } from '../hydratable/$.js'
import { Uhl } from '../uhl/$.js'
import { Value } from '../value/$.js'

export * from './transformations.js'

export interface Index {
  readonly fragments: Map<string, Fragment['value']>
  graph: Graph.DependencyGraph
}

export const create = (): Index => {
  return {
    fragments: new Map(),
    graph: Graph.create(),
  }
}

//
//
//
//
// Add
//
// ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//
//
//

//
//
//
// ━━━━━━━━━━━━━━ • Values
//
//

/**
 * Import a hydrated root value from memory.
 */
export const addRootValue = (
  index: Index,
  rootValue: Value.Hydratable,
  hydrationContext: Hydratable.Context,
): void => {
  const fragments = fragmentsFromRootValue(rootValue, hydrationContext)
  // zd(fragments)

  for (const fragment of fragments) {
    addFragment(index, fragment)
  }

  const dehydrationResult = Value.dehydrateWithDependencies(rootValue, hydrationContext)
  index.graph = dehydrationResult.graph
}

//
//
//
// ━━━━━━━━━━━━━━ • Fragment Assets
//
//

/**
 * Import from fragments - batch import from file data and mark as imported
 * This ensures atomic import - either all fragments are imported or none
 */
export const addFragmentAssets = (
  fragments: FragmentAsset[],
  index: Index,
  hydrationContext: Hydratable.Context,
): void => {
  for (const fragment of fragments) {
    addFragmentAsset(index, fragment, hydrationContext)
  }
}

/**
 * Import a single fragment into the index
 * Note: This is a partial import that doesn't handle dependencies.
 * For complete import with dependency analysis, use importData() instead.
 */
export const addFragmentAsset = (
  index: Index,
  fragmentAsset: FragmentAsset,
  hydrationContext: Hydratable.Context,
): void => {
  const fragment = fragmentAssetToFragment(fragmentAsset, hydrationContext)
  addFragment(index, fragment)
}

//
//
//
// ━━━━━━━━━━━━━━ • Fragments
//
//

export const addFragments = (
  index: Index,
  fragments: Fragment[],
): void => {
  for (const fragment of fragments) {
    addFragment(index, fragment)
  }
}

/**
 * Adds located hydratables to the index using their UHL as the key
 * Hydrated values take precedence over dehydrated ones when they share the same UHL.
 * When a hydrated value replaces a dehydrated one, all references to the dehydrated
 * value are mutated to point to the hydrated value.
 *
 * @param fragment - Hydratable with its UHL location
 * @param index - The Bridge index to add entries to
 */
export const addFragment = (
  index: Index,
  fragment: Fragment,
): void => {
  const currentValue = getValue(index, fragment.uhl)

  // No existing value, just add it
  if (!currentValue) {
    // zd(index, fragment)
    const key = Uhl.toString(fragment.uhl)
    index.fragments.set(key, fragment.value)
    return
  }

  if (Value.isHydrated(fragment.value) && Value.isDehydrated(currentValue)) {
    // Hydrated value replaces dehydrated - mutate the dehydrated value
    // We know existingValue is tagged because dehydrated values are tagged structs
    EffectKit.Struct.clearExceptTag(currentValue as unknown as EffectKit.Struct.TaggedStruct)
    // Copy all properties from hydrated value
    Object.assign(currentValue, fragment.value)
    // The index already has the reference, no need to set again
  }

  // Otherwise keep existing (hydrated beats everything)
}

//
//
//
//
//
// Get
//
// ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//
//
//

export const getValue = (index: Index, uhl: Uhl.Uhl): null | Value.Hydratable => {
  return index.fragments.get(Uhl.toString(uhl)) ?? null
}

//
//
//
//
//
// Utilities
//
// ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//
//
//

export const hasRoot = (index: Index): boolean => {
  return getRootValue(index) !== null
}

export const getRootValue = (index: Index): Value.Hydratable | null => {
  return getValue(index, Uhl.makeRoot())
}
