import { S } from '#dep/effect'
import { FsLoc } from '@wollybeard/kit'
import { Test } from '@wollybeard/kit/test'
import { expect } from 'vitest'
import { lint } from './linter.js'
import { RouteLogical } from './models/route-logical.js'
import { Route } from './models/route.js'

const l = FsLoc.fromString

const createRoute = (dir: FsLoc.RelDir, order?: number, isIndex = false): Route => {
  const base = l('/project/pages/')
  const segments = dir.path.segments
  const name = isIndex ? 'index' : (segments[segments.length - 1] || 'root')
  const relativePath = FsLoc.join(dir, S.decodeSync(FsLoc.RelFile.String)(`./${name}.md`))
  const absolutePath = FsLoc.toAbs(relativePath, base)

  return Route.make({
    logical: RouteLogical.make({
      path: FsLoc.Path.Abs.make({ segments: [...segments] }),
      order,
    }),
    file: absolutePath,
  })
}

// dprint-ignore
Test.describe('linter')
  .i<{ routes: { loc: FsLoc.RelDir; order?: number; isIndex?: boolean }[] }>()
  .o<{ diagnosticCount: number; message?: string; checkDiagnostic?: (diagnostic: any) => void }>()
  .cases(
    [
      'warns about numbered prefix on index files',
      [{
        routes: [
          { loc: l('./docs/'), order: 10, isIndex: true }, // 10_index.md
          { loc: l('./docs/getting-started/') },
        ],
      }],
      {
        diagnosticCount: 1,
        message: 'Numbered prefix on index file has no effect',
        checkDiagnostic: (diagnostic: any) => {
          expect(diagnostic).toMatchObject({
            message: expect.stringContaining('Numbered prefix on index file has no effect'),
            file: expect.any(Object),
            order: 10,
          })
        },
      }
    ],
    [
      'no warning for index files without numbered prefix',
      [{
        routes: [
          { loc: l('./docs/'), isIndex: true }, // index.md
          { loc: l('./docs/getting-started/') },
        ],
      }],
      {
        diagnosticCount: 0,
      },
    ],
    [
      'warns about numbered prefix conflicts',
      [{
        routes: [
          { loc: l('./about/'), order: 10 }, // 10_about.md
          { loc: l('./about/'), order: 20 }, // 20_about.md
        ],
      }],
      {
        diagnosticCount: 1,
        message: 'conflicting routes due to numbered prefixes',
        checkDiagnostic: (diagnostic: any) => {
          expect(diagnostic).toMatchObject({
            message: expect.stringContaining('conflicting routes due to numbered prefixes'),
            kept: expect.objectContaining({ order: 20 }),
            dropped: expect.objectContaining({ order: 10 }),
          })
        },
      }
    ],
    [
      'warns about index/literal conflicts',
      [{
        routes: [
          { loc: l('./docs/'), isIndex: true }, // docs/index.md
          { loc: l('./docs/') }, // docs.md - same logical path as docs/index.md
        ],
      }],
      {
        diagnosticCount: 1,
        message: 'conflicting routes',
        checkDiagnostic: (diagnostic: any) => {
          expect(diagnostic).toMatchObject({
            message: expect.stringContaining('conflicting routes'),
            literal: expect.any(Object),
            index: expect.any(Object),
          })
        },
      }
    ],
    [
      'warns about numbered prefix conflicts with same order number',
      [{
        routes: [
          { loc: l('./about/'), order: 10 }, // 10_about.md
          { loc: l('./about/'), order: 10 }, // 10-about.md (same order)
        ],
      }],
      {
        diagnosticCount: 1,
        message: 'Both files have the same order number (10)',
        checkDiagnostic: (diagnostic: any) => {
          expect(diagnostic).toMatchObject({
            message: expect.stringContaining('Both files have the same order number (10)'),
            kept: expect.objectContaining({ order: 10 }),
            dropped: expect.objectContaining({ order: 10 }),
          })
        },
      }
    ],
  )
  .test((i, o) => {
    const routeObjects = i.routes.map(r => createRoute(r.loc, r.order, r.isIndex))
    const result = lint(routeObjects)

    expect(result.diagnostics).toHaveLength(o.diagnosticCount)

    if (o.diagnosticCount > 0 && o.checkDiagnostic) {
      o.checkDiagnostic(result.diagnostics[0])
    }
  })
