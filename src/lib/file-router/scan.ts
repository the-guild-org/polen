import { TinyGlobby } from '#dep/tiny-globby/index'
import { Path, Str } from '@wollybeard/kit'
import { type Diagnostic, lint } from './linter.js'
import { type Route, type RouteFile, type RouteLogical } from './route.js'

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
    pattern: Str.pattern<{ groups: [`order`, `name`] }>(/^(?<order>\d+)[_-](?<name>.+)$/),
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
  const { dir, glob = `**/*.{md,mdx}` } = parameters

  // Get all files directly
  const filePaths = await TinyGlobby.glob(glob, {
    absolute: true,
    cwd: dir,
    onlyFiles: true,
  })

  // Convert to routes
  const routes = filePaths.map(filePath => filePathToRoute(filePath, dir))

  // Apply linting
  const lintResult = lint(routes)

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

  // Generate id and parentId for tree building
  const id = filePathExpression // Use absolute path as unique ID
  const relativePath = Path.relative(rootDir, filePathExpression)
  const parentDir = Path.dirname(relativePath)
  const parentId = parentDir === `.` ? null : Path.join(rootDir, parentDir)

  return {
    logical,
    file,
    id,
    parentId,
  }
}

export const filePathToRouteLogical = (filePath: Path.Parsed): RouteLogical => {
  const dirSegments = Str.split(Str.removeSurrounding(filePath.dir, Path.sep), Path.sep)

  // Parse numbered prefixes from directory segments
  const dirPath = dirSegments.map(segment => {
    const prefixMatch = Str.match(segment, conventions.numberedPrefix.pattern)
    return prefixMatch?.groups.name ?? segment
  })

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
