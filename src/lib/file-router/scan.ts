import { TinyGlobby } from '#dep/tiny-globby/index'
import { Tree } from '#lib/tree/index'
import { Path, Str } from '@wollybeard/kit'
import { type Diagnostic, lint } from './linter.ts'
import { type Route, type RouteFile, type RouteLogical, routeToPathExpression } from './route.ts'
import { scanTree } from './scan-tree.ts'

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Variables
//
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
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Types
//
//

export interface ScanResult {
  routes: Route[]
  diagnostics: Diagnostic[]
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Scan
//
//

export const scan = async (parameters: {
  dir: string
  glob?: string
}): Promise<ScanResult> => {
  // Use tree-based scanner
  const treeResult = await scanTree(parameters)

  // Flatten tree to get routes
  const routes: Route[] = []
  Tree.visit(treeResult.routeTree, (node) => {
    if (node.value.type === 'file' && node.value.route) {
      routes.push(node.value.route)
    }
  })

  // Apply linting
  const lintResult = lint(routes)

  // Routes are already sorted by the tree structure
  return lintResult
}

export const filePathToRoute = (filePathExpression: string, rootDir: string): Route => {
  const file: RouteFile = {
    path: {
      absolute: Path.parse(filePathExpression),
      relative: Path.parse(Path.relative(rootDir, filePathExpression)),
    },
  }
  const logical = filePathToRouteLogical(file.path.relative)

  return {
    logical,
    file,
  }
}

export const filePathToRouteLogical = (filePath: Path.Parsed): RouteLogical => {
  const dirPath = Str.split(Str.removeSurrounding(filePath.dir, Path.sep), Path.sep)

  // Parse numbered prefix from filename
  const prefixMatch = Str.match(filePath.name, conventions.numberedPrefix.pattern)
  const order = prefixMatch ? parseInt(prefixMatch.groups.order, 10) : undefined
  const nameWithoutPrefix = prefixMatch?.groups.name ?? filePath.name

  if (nameWithoutPrefix === conventions.index.name) {
    const path = dirPath
    return {
      path,
      order,
    }
  }

  const path = dirPath.concat(nameWithoutPrefix)
  return {
    path,
    order,
  }
}
