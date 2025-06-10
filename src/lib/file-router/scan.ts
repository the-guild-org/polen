import { TinyGlobby } from '#dep/tiny-globby/index'
import { Path, Str } from '@wollybeard/kit'
import { type Diagnostic, lint } from './linter.ts'
import { type Route, type RouteFile, type RouteLogical, routeToPathExpression } from './route.ts'

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
  const { dir, glob = `**/*` } = parameters

  const filePathStrings = await TinyGlobby.glob(glob, {
    absolute: true,
    cwd: dir,
    onlyFiles: true,
  })

  const routes: Route[] = filePathStrings.map(filePath => filePathToRoute(filePath, dir))

  const lintResult = lint(routes)

  // Sort routes by order (if present), then by path
  lintResult.routes.sort((a, b) => {
    // If both have orders, sort by order
    if (a.logical.order !== undefined && b.logical.order !== undefined) {
      return a.logical.order - b.logical.order
    }
    // If only one has order, it comes first
    if (a.logical.order !== undefined) return -1
    if (b.logical.order !== undefined) return 1
    // Otherwise sort alphabetically by path
    return routeToPathExpression(a).localeCompare(routeToPathExpression(b))
  })

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
