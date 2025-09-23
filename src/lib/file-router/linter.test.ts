import { FsLoc } from '@wollybeard/kit'
import { Test } from '@wollybeard/kit/test'
import { expect } from 'vitest'
import { lint } from './linter.js'
import type { Route } from './route.js'

const createRoute = (path: string[], order?: number, isIndex = false): Route => {
  const name = isIndex ? 'index' : path[path.length - 1]!
  const dir = path.slice(0, -1).join('/')
  const relativePath = dir ? `${dir}/${name}.md` : `${name}.md`
  const absolutePath = `/project/pages/${relativePath}`

  return {
    logical: {
      path,
      order,
    },
    file: {
      path: {
        relative: FsLoc.decodeSync(relativePath),
        absolute: FsLoc.decodeSync(absolutePath),
      },
    },
    id: absolutePath,
    parentId: path.length > 1 ? `/project/pages/${dir}` : null,
  }
}

interface LinterTestInput {
  routes: Array<{ path: string[]; order?: number; isIndex?: boolean }>
}

interface LinterTestOutput {
  expectedDiagnosticCount: number
  expectedMessage?: string
  checkDiagnostic?: (diagnostic: any) => void
}

// dprint-ignore
Test.Table.suite<LinterTestInput, LinterTestOutput>('linter', [
  {
    n: 'warns about numbered prefix on index files',
    i: {
      routes: [
        { path: ['docs'], order: 10, isIndex: true }, // 10_index.md
        { path: ['docs', 'getting-started'] },
      ],
    },
    o: {
      expectedDiagnosticCount: 1,
      expectedMessage: 'Numbered prefix on index file has no effect',
      checkDiagnostic: (diagnostic: any) => {
        expect(diagnostic).toMatchObject({
          message: expect.stringContaining('Numbered prefix on index file has no effect'),
        file: expect.objectContaining({
          path: expect.objectContaining({
            relative: expect.any(Object),
          }),
          }),
          order: 10,
        })
      },
    }
  },
  {
    n: 'no warning for index files without numbered prefix',
    i: {
      routes: [
        { path: ['docs'], isIndex: true }, // index.md
        { path: ['docs', 'getting-started'] },
      ],
    },
    o: {
      expectedDiagnosticCount: 0,
    },
  },
  {
    n: 'warns about numbered prefix conflicts',
    i: {
      routes: [
        { path: ['about'], order: 10 }, // 10_about.md
        { path: ['about'], order: 20 }, // 20_about.md
      ],
    },
    o: {
      expectedDiagnosticCount: 1,
      expectedMessage: 'conflicting routes due to numbered prefixes',
      checkDiagnostic: (diagnostic: any) => {
        expect(diagnostic).toMatchObject({
          message: expect.stringContaining('conflicting routes due to numbered prefixes'),
          kept: expect.objectContaining({ order: 20 }),
          dropped: expect.objectContaining({ order: 10 }),
        })
      },
    }
  },
  {
    n: 'warns about index/literal conflicts',
    i: {
      routes: [
        { path: ['docs'], isIndex: true }, // docs/index.md
        { path: ['docs'] }, // docs.md
      ],
    },
    o: {
      expectedDiagnosticCount: 1,
      expectedMessage: 'conflicting routes',
      checkDiagnostic: (diagnostic: any) => {
        expect(diagnostic).toMatchObject({
          message: expect.stringContaining('conflicting routes'),
          literal: expect.any(Object),
          index: expect.any(Object),
        })
      },
    }
  },
  {
    n: 'warns about numbered prefix conflicts with same order number',
    i: {
      routes: [
        { path: ['about'], order: 10 }, // 10_about.md
        { path: ['about'], order: 10 }, // 10-about.md (same order)
      ],
    },
    o: {
      expectedDiagnosticCount: 1,
      expectedMessage: 'Both files have the same order number (10)',
      checkDiagnostic: (diagnostic: any) => {
        expect(diagnostic).toMatchObject({
          message: expect.stringContaining('Both files have the same order number (10)'),
          kept: expect.objectContaining({ order: 10 }),
          dropped: expect.objectContaining({ order: 10 }),
        })
      },
    }
  },
], ({ i, o }) => {
  const routeObjects = i.routes.map(r => createRoute(r.path, r.order, r.isIndex))
  const result = lint(routeObjects)

  expect(result.diagnostics).toHaveLength(o.expectedDiagnosticCount)

  if (o.expectedDiagnosticCount > 0 && o.checkDiagnostic) {
    o.checkDiagnostic(result.diagnostics[0])
  }
})
