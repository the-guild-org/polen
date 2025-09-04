import { S } from '#lib/kit-temp/effect'

// ─── Schema ──────────────────────────────────────────────────────────────────

/**
 * Dependency graph for tracking relationships between nodes
 * Used to efficiently handle dependencies in various contexts
 */
export const DependencyGraph = S.Struct({
  /**
   * Map from parent ID to array of child IDs (parent depends on children)
   */
  dependencies: S.Record({ key: S.String, value: S.Array(S.String) }),

  /**
   * Map from child ID to array of parent IDs (child is depended on by parents)
   */
  dependents: S.Record({ key: S.String, value: S.Array(S.String) }),
}).annotations({
  identifier: 'DependencyGraph',
  description: 'A directed graph tracking dependencies between nodes',
})

export type DependencyGraph = typeof DependencyGraph.Type

// ─── Constructors ────────────────────────────────────────────────────────────

export const make = DependencyGraph.make

/**
 * Create an empty dependency graph
 */
export const create = (): DependencyGraph =>
  make({
    dependencies: {},
    dependents: {},
  })

// ─── Domain Logic ────────────────────────────────────────────────────────────

/**
 * Add a dependency relationship (immutable)
 * @param graph - The dependency graph
 * @param parent - The parent node ID
 * @param child - The child node ID that the parent depends on
 * @returns A new graph with the dependency added
 */
export const addDependency = (
  graph: DependencyGraph,
  parent: string,
  child: string,
): DependencyGraph => {
  // Get existing arrays or create empty ones
  const children = graph.dependencies[parent] || []
  const parents = graph.dependents[child] || []

  // Add child if not already present
  const newChildren = children.includes(child) ? children : [...children, child]

  // Add parent if not already present
  const newParents = parents.includes(parent) ? parents : [...parents, parent]

  return make({
    dependencies: {
      ...graph.dependencies,
      [parent]: newChildren,
    },
    dependents: {
      ...graph.dependents,
      [child]: newParents,
    },
  })
}

/**
 * Add a dependency relationship (mutable)
 * @param graph - The dependency graph to mutate
 * @param parent - The parent node ID
 * @param child - The child node ID that the parent depends on
 */
export const addDependencyMutable = (
  graph: DependencyGraph,
  parent: string,
  child: string,
): void => {
  // Cast to mutable for mutation
  const mutableGraph = graph as {
    dependencies: Record<string, string[]>
    dependents: Record<string, string[]>
  }

  // Add to dependencies
  if (!mutableGraph.dependencies[parent]) {
    mutableGraph.dependencies[parent] = []
  }
  if (!mutableGraph.dependencies[parent].includes(child)) {
    mutableGraph.dependencies[parent].push(child)
  }

  // Add to dependents
  if (!mutableGraph.dependents[child]) {
    mutableGraph.dependents[child] = []
  }
  if (!mutableGraph.dependents[child].includes(parent)) {
    mutableGraph.dependents[child].push(parent)
  }
}

/**
 * Find all nodes that have no dependencies (leaf nodes)
 */
export const findLeafNodes = (graph: DependencyGraph): Set<string> => {
  const leaves = new Set<string>()

  // Check all nodes that appear as children
  for (const child of Object.keys(graph.dependents)) {
    const deps = graph.dependencies[child]
    if (!deps || deps.length === 0) {
      leaves.add(child)
    }
  }

  return leaves
}

/**
 * Check if all dependencies of a node have been processed
 */
export const areDependenciesReady = (
  node: string,
  graph: DependencyGraph,
  processed: Set<string>,
): boolean => {
  const deps = graph.dependencies[node]
  if (!deps) return true

  return deps.every(dep => processed.has(dep))
}

/**
 * Get topological ordering of nodes (children before parents)
 * This ensures we process dependencies before the nodes that depend on them
 *
 * @param graph - The dependency graph
 * @returns Array of node IDs in topological order
 */
export const topologicalSort = (graph: DependencyGraph): string[] => {
  const result: string[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>() // For cycle detection

  // Get all nodes
  const allNodes = new Set<string>()
  for (const parent of Object.keys(graph.dependencies)) {
    allNodes.add(parent)
  }
  for (const child of Object.keys(graph.dependents)) {
    allNodes.add(child)
  }

  const visit = (node: string): void => {
    if (visited.has(node)) return

    if (visiting.has(node)) {
      // Cycle detected - just skip this node
      return
    }

    visiting.add(node)

    // Visit all children first
    const children = graph.dependencies[node]
    if (children) {
      for (const child of children) {
        visit(child)
      }
    }

    visiting.delete(node)
    visited.add(node)
    result.push(node)
  }

  // Visit all nodes
  for (const node of allNodes) {
    visit(node)
  }

  return result
}

// ─── Codec ───────────────────────────────────────────────────────────────────

export const decode = S.decode(DependencyGraph)
export const decodeSync = S.decodeSync(DependencyGraph)
export const encode = S.encode(DependencyGraph)
export const encodeSync = S.encodeSync(DependencyGraph)
