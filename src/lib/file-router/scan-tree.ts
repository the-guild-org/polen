import { TinyGlobby } from '#dep/tiny-globby/index'
import { Tree, type TreeNode } from '#lib/tree/index'
import { Path, Str } from '@wollybeard/kit'
import type { Diagnostic } from './linter.ts'
import type { Route, RouteFile } from './route.ts'

//
// Types
//

export type RouteTreeNodeType = 'directory' | 'file'

export interface RouteTreeNodeValue {
  name: string
  order?: number
  type: RouteTreeNodeType
  route?: Route // Only present for file nodes
}

export type RouteTreeNode = TreeNode<RouteTreeNodeValue>

export interface ScanTreeResult {
  routeTree: RouteTreeNode
  diagnostics: Diagnostic[]
}

//
// Constants
//

const conventions = {
  index: {
    name: `index`,
  },
  numberedPrefix: {
    pattern: Str.pattern<{ groups: ['order', 'name'] }>(/^(?<order>\d+)[_-](?<name>.+)$/),
  },
}

//
// Helpers
//

const parseSegment = (segment: string): { name: string; order?: number } => {
  const match = Str.match(segment, conventions.numberedPrefix.pattern)
  if (match) {
    return {
      name: match.groups.name,
      order: parseInt(match.groups.order, 10),
    }
  }
  return { name: segment }
}

const buildRouteTreeFromPaths = async (paths: string[], rootDir: string): Promise<RouteTreeNode> => {
  // Root node (represents the pages directory itself)
  const root = Tree.node<RouteTreeNodeValue>({
    name: 'root',
    type: 'directory',
  })

  // Process each file path
  for (const filePath of paths) {
    const relativePath = Path.relative(rootDir, filePath)

    // Split the path into segments
    const segments = relativePath.split(Path.sep).filter(s => s.length > 0)
    if (segments.length === 0) continue // Skip root directory

    // Navigate/create path in tree
    let currentNode = root

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!
      const isLast = i === segments.length - 1

      // Parse segment for ordering
      let segmentName = segment
      // Strip extension for files
      if (isLast && (segment.endsWith('.md') || segment.endsWith('.mdx'))) {
        segmentName = segment.replace(/\.(md|mdx)$/, '')
      }
      const parsed = parseSegment(segmentName)

      // Find existing child
      const existingChildIndex = currentNode.children.findIndex(child => child.value.name === parsed.name)
      let childNode = existingChildIndex >= 0 ? currentNode.children[existingChildIndex] : undefined

      if (!childNode) {
        // Create new node
        if (isLast) {
          // This is a file
          const route = filePathToRoute(filePath, rootDir)
          childNode = Tree.node<RouteTreeNodeValue>({
            name: parsed.name,
            order: parsed.order,
            type: 'file',
            route,
          })
        } else {
          // This is a directory (implicit from file path)
          childNode = Tree.node<RouteTreeNodeValue>({
            name: parsed.name,
            order: parsed.order,
            type: 'directory',
          })
        }
        currentNode.children.push(childNode)
      } else if (isLast && childNode.value.type === 'file') {
        // Handle collision for files with same name
        // If new file has higher or equal order, replace the existing one (last wins for ties)
        if (
          parsed.order !== undefined
          && (childNode.value.order === undefined || parsed.order >= childNode.value.order)
        ) {
          const route = filePathToRoute(filePath, rootDir)
          const newNode = Tree.node<RouteTreeNodeValue>({
            name: parsed.name,
            order: parsed.order,
            type: 'file',
            route,
          })
          currentNode.children[existingChildIndex] = newNode
          childNode = newNode
        }
        // Otherwise keep the existing node (when existing has higher order)
      }

      currentNode = childNode
    }
  }

  // Sort the tree
  return sortRouteTree(root)
}

const sortRouteTree = (tree: RouteTreeNode): RouteTreeNode => {
  return Tree.sort(tree, (a, b) => {
    // If both have orders, sort by order
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    // If only one has order, it comes first
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    // Otherwise sort alphabetically
    return a.name.localeCompare(b.name)
  })
}

//
// Main scan function
//

export const scanTree = async (parameters: {
  dir: string
  glob?: string
}): Promise<ScanTreeResult> => {
  const { dir, glob = `**/*` } = parameters

  // Get all files
  const filePaths = await TinyGlobby.glob(glob, {
    absolute: true,
    cwd: dir,
    onlyFiles: true,
  })

  // Build tree structure (directories will be created implicitly)
  const routeTree = await buildRouteTreeFromPaths(filePaths, dir)

  // TODO: Implement tree-based linting
  const diagnostics: Diagnostic[] = []

  return {
    routeTree,
    diagnostics,
  }
}

// Reuse existing route creation logic
const filePathToRoute = (filePathExpression: string, rootDir: string): Route => {
  const file: RouteFile = {
    path: {
      absolute: Path.parse(filePathExpression),
      relative: Path.parse(Path.relative(rootDir, filePathExpression)),
    },
  }

  const dirPath = Str.split(Str.removeSurrounding(file.path.relative.dir, Path.sep), Path.sep)

  // Parse numbered prefix from filename
  const prefixMatch = file.path.relative.name.match(conventions.numberedPrefix.pattern)
  const order = prefixMatch?.groups?.[`order`] ? parseInt(prefixMatch.groups[`order`], 10) : undefined
  const nameWithoutPrefix = prefixMatch?.groups?.[`name`] ?? file.path.relative.name

  const logical = {
    path: nameWithoutPrefix === conventions.index.name ? dirPath : dirPath.concat(nameWithoutPrefix),
    order,
  }

  return {
    logical,
    file,
  }
}
