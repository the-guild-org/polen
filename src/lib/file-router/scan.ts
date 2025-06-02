import { TinyGlobby } from '#dep/tiny-globby/index.js'
import { Path, Str } from '@wollybeard/kit'
import { type Diagnostic, lint } from './linter.js'
import type { Route, RouteFile, RoutePath } from './route.js'

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

  return lintResult
}

export const filePathToRoute = (filePathExpression: string, rootDir: string): Route => {
  const file: RouteFile = {
    path: {
      absolute: Path.parse(filePathExpression),
      relative: Path.parse(Path.relative(rootDir, filePathExpression)),
    },
  }
  const path = filePathToRoutePath(file.path.relative)

  return {
    path,
    file,
  }
}

export const filePathToRoutePath = (filePath: Path.Parsed): RoutePath => {
  const dirSegments = Str.split(Str.removeSurrounding(filePath.dir, Path.sep), Path.sep)

  if (Str.isMatch(filePath.name, conventions.index.name)) {
    const segments = dirSegments
    return {
      segments,
    }
  }

  const segments = dirSegments.concat(filePath.name)
  return {
    segments,
  }
}
