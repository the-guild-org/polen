import { Ef, S } from '#dep/effect'
import { Fs, FsLoc } from '@wollybeard/kit'
import { Effect, pipe } from 'effect'
import * as _ from 'effect/SchemaAST'
import { FileRouterDiagnostic, lint } from './linter.js'
import { Route, RouteContext, RouteFromAbsFile } from './models/route.js'

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Constants
//
//

const DEFAULT_GLOB = `**/*.{md,mdx}`

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Schema
//
//

export class ScanResult extends S.Class<ScanResult>('ScanResult')({
  routes: S.Array(Route),
  diagnostics: S.Array(FileRouterDiagnostic),
}) {
  static is = S.is(ScanResult)
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Scan
//
//

export const scan = (parameters: {
  dir: FsLoc.AbsDir
  glob?: string | undefined
}): Ef.Effect<ScanResult, Error, never> =>
  Ef.gen(function*() {
    const { dir, glob = DEFAULT_GLOB } = parameters

    // Discover files
    const absoluteFiles = yield* Fs.glob(glob, {
      cwd: dir,
      absolute: true,
      onlyFiles: true,
    })

    const routes = yield* Effect.forEach(
      absoluteFiles,
      _ => pipe(_, S.decode(RouteFromAbsFile), Effect.provideService(RouteContext, { rootDir: dir })),
    )

    // Lint and deduplicate routes
    const lintResult = lint(routes)

    return ScanResult.make({
      routes: lintResult.routes,
      diagnostics: lintResult.diagnostics,
    })
  })
