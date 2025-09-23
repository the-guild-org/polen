import { Ef, Op } from '#dep/effect'
import { Fs, FsLoc, Str } from '@wollybeard/kit'
import { String } from 'effect'
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
  dir: FsLoc.AbsDir.AbsDir
  glob?: string | undefined
  files?: FsLoc.RelFile.RelFile[] | undefined
}): Ef.Effect<ScanResult, Error, never> =>
  Ef.gen(function*() {
    const { dir, glob = `**/*.{md,mdx}`, files } = parameters

    let absoluteFiles: FsLoc.AbsFile.AbsFile[]

    if (files && files.length > 0) {
      absoluteFiles = files.map(relFile => FsLoc.join(dir, relFile))
    } else {
      absoluteFiles = yield* Fs.glob(glob, {
        absolute: true,
        cwd: dir,
        onlyFiles: true,
      })
    }

    // Convert to routes
    const routes = absoluteFiles.map((filePathLoc) => {
      return filePathToRoute(filePathLoc, dir)
    })

    // Apply linting
    const lintResult = lint(routes)

    return {
      routes: lintResult.routes,
      diagnostics: lintResult.diagnostics,
    }
  })

export const filePathToRoute = (filePathExpression: FsLoc.AbsFile.AbsFile, rootDir: FsLoc.AbsDir.AbsDir): Route => {
  const filePathStr = FsLoc.encodeSync(filePathExpression)
  const rootDirStr = FsLoc.encodeSync(rootDir)

  const file: RouteFile = {
    path: {
      absolute: filePathExpression,
      relative: FsLoc.toRel(filePathExpression, rootDir),
    },
  }
  const logical = filePathToRouteLogical(FsLoc.encodeSync(file.path.relative))

  // Generate id and parentId for tree building
  const id = filePathStr // Use absolute path as unique ID
  const relativePath = FsLoc.encodeSync(FsLoc.toRel(filePathExpression, rootDir))
  const parentDirLoc = FsLoc.up(filePathExpression)
  const parentId = parentDirLoc && !FsLoc.equivalence(parentDirLoc, rootDir)
    ? FsLoc.encodeSync(parentDirLoc)
    : null

  return {
    logical,
    file,
    id,
    parentId,
  }
}

export const filePathToRouteLogical = (relativePathStr: string): RouteLogical => {
  // Parse the path to get directory and filename
  const lastSlash = relativePathStr.lastIndexOf('/')
  const dir = lastSlash >= 0 ? relativePathStr.slice(0, lastSlash) : ''
  const fileName = lastSlash >= 0 ? relativePathStr.slice(lastSlash + 1) : relativePathStr
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')

  // Remove leading/trailing path separators and split by separator
  const dirWithoutSeparators = Str.removeSurrounding(dir, '/')

  // Handle empty directory case - should result in empty array, not ['']
  const dirSegments = dirWithoutSeparators === ''
    ? []
    : String.split('/')(dirWithoutSeparators)

  // Parse numbered prefixes from directory segments
  const dirPath = dirSegments.map(segment => {
    const opMatch = Str.match(segment, conventions.numberedPrefix.pattern)
    return Op.match(opMatch, {
      onNone: () => segment,
      onSome: (match) => match.groups.name,
    })
  })

  // Parse numbered prefix from filename
  const matchResult = Str.match(nameWithoutExt, conventions.numberedPrefix.pattern)

  const { order, nameWithoutPrefix } = Op.match(matchResult, {
    onNone: () => ({ order: undefined, nameWithoutPrefix: nameWithoutExt }),
    onSome: (match) => ({
      order: parseInt(match.groups.order, 10),
      nameWithoutPrefix: match.groups.name,
    }),
  })

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
