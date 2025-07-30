/**
 * Functions for locating hydratables within values using hydratables trees.
 *
 * This module provides the core logic for traversing data structures to find
 * hydratable values (unions of hydrated/dehydrated variants) and building
 * location paths that uniquely identify each hydratable's position.
 *
 * @module
 */

import { EffectKit } from '#lib/kit-temp/effect'
import type { HydratablesPathsTree } from '../../schema/build-hydratables-paths-tree.js'
import { UHL } from '../../uhl/$.js'
import { Value } from '../../value/$.js'

/**
 * Locates all hydratables (both hydrated and dehydrated) in a value using the hydratables tree
 *
 * @param value - The value to search for hydratables
 * @param tree - The hydratables tree that describes the structure
 * @param uhl - The current UHL path (used internally for recursion)
 * @returns Array of located hydratables with their locations
 */
export const locateHydratables = (
  value: unknown,
  tree: HydratablesPathsTree,
  uhl: UHL.UHL = [],
): Value.Located[] => {
  const results: Value.Located[] = []

  // Check if value is a tagged struct
  if (!EffectKit.Struct.isTagged(value)) {
    return results
  }

  // If this node is a hydratable, capture it
  if (tree.hydratableSegmentTemplate) {
    // Build the UHL for this hydratable
    let hydratableUHL = [...uhl]

    // Add this hydratable's segment
    const segment = createUHLSegment(tree, value)
    if (segment) {
      // For top-level, we just have the segment
      // For nested, we append to the parent UHL
      if (uhl.length === 0) {
        hydratableUHL = [segment]
      } else {
        hydratableUHL.push(segment)
      }
    }

    results.push({ value, uhl: hydratableUHL })
  }

  // If this node is a hydratable, build UHL that includes it
  let currentUHL = [...uhl]
  if (tree.hydratableSegmentTemplate && EffectKit.Struct.isTagged(value)) {
    const segment = createUHLSegment(tree, value)
    if (segment) {
      currentUHL.push(segment)
    }
  }

  // Traverse children
  for (const [propName, childTree] of tree.children) {
    if (propName === '[array]') {
      // This is array metadata - the actual array is in the parent value
      // Skip this case as it's handled by the parent
      continue
    }

    const childValue = (value as any)[propName]
    if (childValue === undefined || childValue === null) continue

    if (Array.isArray(childValue)) {
      // Check if there's array metadata for this property
      const arrayTree = childTree.children.get('[array]')
      if (arrayTree) {
        results.push(...processArrayElements(childValue, arrayTree, currentUHL))
      }
    } else {
      results.push(...processObjectProperty(childValue, childTree, currentUHL, propName))
    }
  }

  return results
}

/**
 * Locates only hydrated hydratables in a value using the hydratables tree
 *
 * @param value - The value to search for hydrated hydratables
 * @param tree - The hydratables tree that describes the structure
 * @param uhl - The current UHL path (used internally for recursion)
 * @returns Array of located hydrated hydratables with their locations
 */
export const locateHydratedHydratables = (
  value: unknown,
  tree: HydratablesPathsTree,
  uhl: UHL.UHL = [],
): Value.Located[] => {
  const results: Value.Located[] = []

  // Check if value is a tagged struct
  if (!EffectKit.Struct.isTagged(value)) {
    return results
  }

  // If this node is a hydratable AND hydrated, capture it
  if (tree.hydratableSegmentTemplate && isHydratedValue(value)) {
    // Build the UHL for this hydratable
    let hydratableUHL = [...uhl]

    // Add this hydratable's segment
    const segment = createUHLSegment(tree, value)
    if (segment) {
      // For top-level, we just have the segment
      // For nested, we append to the parent UHL
      if (uhl.length === 0) {
        hydratableUHL = [segment]
      } else {
        hydratableUHL.push(segment)
      }
    }

    results.push({ value, uhl: hydratableUHL })
  }

  // If this node is a hydratable, build UHL that includes it
  let currentUHL = [...uhl]
  if (tree.hydratableSegmentTemplate && EffectKit.Struct.isTagged(value)) {
    const segment = createUHLSegment(tree, value)
    if (segment) {
      currentUHL.push(segment)
    }
  }

  // Traverse children
  for (const [propName, childTree] of tree.children) {
    if (propName === '[array]') {
      // This is array metadata - the actual array is in the parent value
      // Skip this case as it's handled by the parent
      continue
    }

    const childValue = (value as any)[propName]
    if (childValue === undefined || childValue === null) continue

    if (Array.isArray(childValue)) {
      // Check if there's array metadata for this property
      const arrayTree = childTree.children.get('[array]')
      if (arrayTree) {
        results.push(...processArrayElementsHydrated(childValue, arrayTree, currentUHL))
      }
    } else {
      results.push(...processObjectPropertyHydrated(childValue, childTree, currentUHL, propName))
    }
  }

  return results
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if a value is hydrated (not dehydrated)
 */
const isHydratedValue = (value: unknown): boolean => {
  if (!EffectKit.Struct.isTagged(value)) return false
  // Check if the value has _dehydrated: true
  return !(value as any)._dehydrated
}

/**
 * Creates a UHL segment for a hydratable
 */
const createUHLSegment = (
  tree: HydratablesPathsTree,
  value: unknown,
): UHL.Segment | null => {
  if (!tree.hydratableSegmentTemplate || !EffectKit.Struct.isTagged(value)) {
    return null
  }

  // Extract unique key values
  const uniqueKeys: Record<string, string | number> = {}
  for (const key of tree.hydratableSegmentTemplate.uniqueKeys) {
    if (key in value) {
      uniqueKeys[key] = (value as any)[key]
    }
  }

  return UHL.makeSegment(
    value._tag,
    uniqueKeys,
    tree.hydratableSegmentTemplate.adt,
  )
}

/**
 * Processes array elements to find hydratables
 */
const processArrayElements = (
  elements: unknown[],
  tree: HydratablesPathsTree,
  uhl: UHL.UHL,
): Value.Located[] => {
  const results: Value.Located[] = []

  for (const element of elements) {
    if (!EffectKit.Struct.isTagged(element)) continue

    // Process each element with the array's tree structure
    results.push(...locateHydratables(element, tree, uhl))
  }

  return results
}

/**
 * Processes array elements to find only hydrated hydratables
 */
const processArrayElementsHydrated = (
  elements: unknown[],
  tree: HydratablesPathsTree,
  uhl: UHL.UHL,
): Value.Located[] => {
  const results: Value.Located[] = []

  for (const element of elements) {
    if (!EffectKit.Struct.isTagged(element)) continue

    // Process each element with the array's tree structure
    results.push(...locateHydratedHydratables(element, tree, uhl))
  }

  return results
}

/**
 * Processes an object property to find hydratables
 */
const processObjectProperty = (
  value: unknown,
  tree: HydratablesPathsTree,
  uhl: UHL.UHL,
  propName: string,
): Value.Located[] => {
  // Recursively process the child with the current UHL
  return locateHydratables(value, tree, uhl)
}

/**
 * Processes an object property to find only hydrated hydratables
 */
const processObjectPropertyHydrated = (
  value: unknown,
  tree: HydratablesPathsTree,
  uhl: UHL.UHL,
  propName: string,
): Value.Located[] => {
  // Recursively process the child with the current UHL
  return locateHydratedHydratables(value, tree, uhl)
}
