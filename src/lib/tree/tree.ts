/**
 * Generic tree data structure and utilities
 */

export interface TreeNode<T> {
  value: T
  children: TreeNode<T>[]
}

export type TreeVisitor<T, R = void> = (node: TreeNode<T>, depth: number, path: T[]) => R

export type TreeMapper<T, U> = (value: T, depth: number, path: T[]) => U

export type TreePredicate<T> = (value: T, depth: number, path: T[]) => boolean

/**
 * Create a new tree node
 */
export const node = <T>(value: T, children: TreeNode<T>[] = []): TreeNode<T> => ({
  value,
  children,
})

/**
 * Map over a tree, transforming each node's value
 */
export const map = <T, U>(
  tree: TreeNode<T>,
  mapper: TreeMapper<T, U>,
  depth = 0,
  path: T[] = [],
): TreeNode<U> => {
  const newPath = [...path, tree.value]
  return {
    value: mapper(tree.value, depth, path),
    children: tree.children.map(child => map(child, mapper, depth + 1, newPath)),
  }
}

/**
 * Visit each node in the tree (depth-first)
 */
export const visit = <T>(
  tree: TreeNode<T>,
  visitor: TreeVisitor<T>,
  depth = 0,
  path: T[] = [],
): void => {
  visitor(tree, depth, path)
  const newPath = [...path, tree.value]
  tree.children.forEach(child => visit(child, visitor, depth + 1, newPath))
}

/**
 * Find a node in the tree
 */
export const find = <T>(
  tree: TreeNode<T>,
  predicate: TreePredicate<T>,
  depth = 0,
  path: T[] = [],
): TreeNode<T> | undefined => {
  if (predicate(tree.value, depth, path)) {
    return tree
  }
  const newPath = [...path, tree.value]
  for (const child of tree.children) {
    const found = find(child, predicate, depth + 1, newPath)
    if (found) return found
  }
  return undefined
}

/**
 * Filter tree nodes (keeps structure, removes non-matching nodes)
 */
export const filter = <T>(
  tree: TreeNode<T>,
  predicate: TreePredicate<T>,
  depth = 0,
  path: T[] = [],
): TreeNode<T> | undefined => {
  const newPath = [...path, tree.value]
  const filteredChildren = tree.children
    .map(child => filter(child, predicate, depth + 1, newPath))
    .filter((child): child is TreeNode<T> => child !== undefined)

  // Keep node if it matches or has matching children
  if (predicate(tree.value, depth, path) || filteredChildren.length > 0) {
    return {
      value: tree.value,
      children: filteredChildren,
    }
  }

  return undefined
}

/**
 * Sort a tree's children at each level
 */
export const sort = <T>(
  tree: TreeNode<T>,
  compareFn: (a: T, b: T) => number,
): TreeNode<T> => ({
  value: tree.value,
  children: tree.children
    .map(child => sort(child, compareFn))
    .sort((a, b) => compareFn(a.value, b.value)),
})

/**
 * Flatten a tree into an array (depth-first)
 */
export const flatten = <T>(tree: TreeNode<T>): T[] => {
  const result: T[] = [tree.value]
  tree.children.forEach(child => {
    result.push(...flatten(child))
  })
  return result
}

/**
 * Get the depth of the tree
 */
export const depth = <T>(tree: TreeNode<T>): number => {
  if (tree.children.length === 0) return 0
  return 1 + Math.max(...tree.children.map(depth))
}

/**
 * Count total nodes in the tree
 */
export const count = <T>(tree: TreeNode<T>): number => {
  return 1 + tree.children.reduce((sum, child) => sum + count(child), 0)
}

/**
 * Check if a node is a leaf (has no children)
 */
export const isLeaf = <T>(node: TreeNode<T>): boolean => {
  return node.children.length === 0
}

/**
 * Get all leaf nodes
 */
export const leaves = <T>(tree: TreeNode<T>): TreeNode<T>[] => {
  if (isLeaf(tree)) return [tree]
  return tree.children.flatMap(leaves)
}

/**
 * Build a tree from a flat list with parent references
 */
export const fromList = <T extends { id: string; parentId?: string }>(
  items: T[],
  rootId?: string,
): TreeNode<T>[] => {
  const itemMap = new Map(items.map(item => [item.id, item]))
  const roots: TreeNode<T>[] = []
  const nodeMap = new Map<string, TreeNode<T>>()

  // Create all nodes
  items.forEach(item => {
    nodeMap.set(item.id, node(item))
  })

  // Build hierarchy
  items.forEach(item => {
    const itemNode = nodeMap.get(item.id)!
    if (item.parentId === rootId) {
      roots.push(itemNode)
    } else if (item.parentId) {
      const parent = nodeMap.get(item.parentId)
      if (parent) {
        parent.children.push(itemNode)
      }
    }
  })

  return roots
}
