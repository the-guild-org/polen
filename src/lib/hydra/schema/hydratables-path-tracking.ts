/**
 * Tracks all paths to hydratables for path disambiguation detection
 *
 * This module builds on top of the HydratablesPathsTree to track when
 * hydratables appear in multiple paths or non-singleton paths, which
 * requires the use of $$ disambiguation in selections.
 */

import { UHL } from '../uhl/$.js'
import type { HydratablesPathsTree, HydratablesPathsTreeNode } from './build-hydratables-paths-tree.js'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Information about a path to a hydratable
 */
export interface HydratablePath {
  /** The path from root as UHL segments (excluding the hydratable itself) */
  path: UHL.UHL
  /** Whether this path contains any non-singleton hydratables */
  hasNonSingletons: boolean
  /** Whether this path contains arrays */
  hasArrays: boolean
}

/**
 * Registry tracking all paths to each hydratable
 */
export interface HydratablePathRegistry {
  /** Map from hydratable tag to all paths where it appears */
  paths: Map<string, HydratablePath[]>
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Builds a registry of all paths to hydratables
 */
export const buildPathRegistry = (tree: HydratablesPathsTree): HydratablePathRegistry => {
  const registry: HydratablePathRegistry = {
    paths: new Map(),
  }

  // Start traversal from root
  traverseTree(tree, [], registry, false, false)

  return registry
}

/**
 * Checks if a hydratable requires $$ disambiguation
 *
 * Returns true if:
 * - The hydratable appears in multiple paths
 * - The hydratable appears in a path with non-singletons
 * - The hydratable appears in a path with arrays
 */
export const requiresDisambiguation = (
  registry: HydratablePathRegistry,
  tag: string,
): boolean => {
  const paths = registry.paths.get(tag)
  if (!paths || paths.length === 0) return false

  // Multiple paths require disambiguation
  if (paths.length > 1) return true

  // Single path - check if it contains non-singletons or arrays
  const path = paths[0]!
  return path.hasNonSingletons || path.hasArrays
}

/**
 * Gets disambiguation info for a hydratable
 */
export const getDisambiguationInfo = (
  registry: HydratablePathRegistry,
  tag: string,
): { required: boolean; paths: HydratablePath[] } => {
  const paths = registry.paths.get(tag) || []
  return {
    required: requiresDisambiguation(registry, tag),
    paths,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Recursively traverses the tree to find all paths to hydratables
 */
const traverseTree = (
  tree: HydratablesPathsTree | HydratablesPathsTreeNode,
  currentPath: UHL.UHL,
  registry: HydratablePathRegistry,
  hasNonSingletons: boolean,
  hasArrays: boolean,
): void => {
  // Check if this is an array node
  const isArrayNode = 'isArrayElement' in tree && tree.isArrayElement
  if (isArrayNode) {
    hasArrays = true
  }

  // If this node is a hydratable, record its path
  if (tree.hydratableSegmentTemplate) {
    const tag = tree.hydratableSegmentTemplate.tag
    const pathInfo: HydratablePath = {
      path: [...currentPath],
      hasNonSingletons,
      hasArrays,
    }

    // Add to registry
    if (!registry.paths.has(tag)) {
      registry.paths.set(tag, [])
    }
    registry.paths.get(tag)!.push(pathInfo)

    // Update hasNonSingletons for children if this hydratable has unique keys
    if (tree.hydratableSegmentTemplate.uniqueKeys.length > 0) {
      hasNonSingletons = true
    }
  }

  // Traverse children
  for (const [propName, childTree] of tree.children) {
    // Build path for child
    let childPath = [...currentPath]

    // If current node is a hydratable, add it to the path
    if (tree.hydratableSegmentTemplate) {
      // For path tracking, we need to convert the template to a segment
      // Since we don't have actual values, we'll cast the template as a segment
      const segment = {
        tag: tree.hydratableSegmentTemplate.tag,
        uniqueKeys: {},  // Empty for path tracking since we only care about structure
        adt: tree.hydratableSegmentTemplate.adt,
      } as UHL.Segment
      childPath.push(segment)
    }

    // Recursively traverse child
    traverseTree(childTree, childPath, registry, hasNonSingletons, hasArrays)
  }
}
