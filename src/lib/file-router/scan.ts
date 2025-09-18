import { O } from '#dep/effect'
import * as TinyGlobbyModule from '#dep/tiny-globby/index'
import { Path, Str } from '@wollybeard/kit'
import { Effect, String } from 'effect'
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

export const scan = (parameters: {
  dir: string
  glob?: string
}): Effect.Effect<ScanResult, Error, never> =>
  Effect.gen(function*() {
    const { dir, glob = `**/*.{md,mdx}` } = parameters

    // Get all files directly
    const filePaths = yield* TinyGlobbyModule.EffectGlobby.glob(glob, {
      absolute: true,
      cwd: dir,
      onlyFiles: true,
    })

    // Convert to routes
    const routes = filePaths.map((filePath: string) => filePathToRoute(filePath, dir))

    // Apply linting
    const lintResult = lint(routes)

    return {
      routes: lintResult.routes,
      diagnostics: lintResult.diagnostics,
    }
  })

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
  // Remove leading/trailing path separators and split by separator
  const dirWithoutSeparators = Str.removeSurrounding(filePath.dir, Path.sep)

  // Handle empty directory case - should result in empty array, not ['']
  const dirSegments = dirWithoutSeparators === ''
    ? []
    : String.split(Path.sep)(dirWithoutSeparators)

  // Parse numbered prefixes from directory segments
  const dirPath = dirSegments.map(segment => {
    const matchResult = String.match(conventions.numberedPrefix.pattern)(segment)
    if (O.isSome(matchResult)) {
      const match = matchResult.value as any
      return match.groups.name
    }
    return segment
  })

  // Parse numbered prefix from filename
  const matchResult = String.match(conventions.numberedPrefix.pattern)(filePath.name)
  let order: number | undefined
  let nameWithoutPrefix: string

  if (O.isSome(matchResult)) {
    const match = matchResult.value as any
    order = parseInt(match.groups.order, 10)
    nameWithoutPrefix = match.groups.name
  } else {
    order = undefined
    nameWithoutPrefix = filePath.name
  }

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
