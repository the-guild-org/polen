import { Test } from '@wollybeard/kit/test'
import { expect } from 'vitest'
import { lint } from './linter.js'
import type { Route } from './route.js'

const createRoute = (path: string[], order?: number, isIndex = false): Route => {
  const name = isIndex ? 'index' : path[path.length - 1]!

  return {
    logical: {
      path,
      order,
    },
    file: {
      path: {
        relative: {
          root: '',
          dir: path.slice(0, -1).join('/'),
          base: `${name}.md`,
          ext: '.md',
          name: name, // Always use the base name, not the prefixed name
        },
        absolute: {
          root: '/',
          dir: `/project/pages/${path.slice(0, -1).join('/')}`,
          base: `${name}.md`,
          ext: '.md',
          name: name,
        },
      },
    },
    id: `/project/pages/${path.join('/')}/${name}.md`,
    parentId: path.length > 1 ? `/project/pages/${path.slice(0, -1).join('/')}` : null,
  }
}

interface LinterTestCase {
  routes: Array<{ path: string[]; order?: number; isIndex?: boolean }>
  expectedDiagnosticCount: number
  expectedMessage?: string
  checkDiagnostic?: (diagnostic: any) => void
}

// dprint-ignore
Test.Table.suite<LinterTestCase>('linter', [
  {
    name: 'warns about numbered prefix on index files',
    routes: [
      { path: ['docs'], order: 10, isIndex: true }, // 10_index.md
      { path: ['docs', 'getting-started'] },
    ],
    expectedDiagnosticCount: 1,
    expectedMessage: 'Numbered prefix on index file has no effect',
    checkDiagnostic: (diagnostic) => {
      expect(diagnostic).toMatchObject({
        message: expect.stringContaining('Numbered prefix on index file has no effect'),
        file: expect.objectContaining({
          path: expect.objectContaining({
            relative: expect.objectContaining({
              name: 'index',
            }),
          }),
        }),
        order: 10,
      })
    }
  },
  {
    name: 'no warning for index files without numbered prefix',
    routes: [
      { path: ['docs'], isIndex: true }, // index.md
      { path: ['docs', 'getting-started'] },
    ],
    expectedDiagnosticCount: 0,
  },
  {
    name: 'warns about numbered prefix conflicts',
    routes: [
      { path: ['about'], order: 10 }, // 10_about.md
      { path: ['about'], order: 20 }, // 20_about.md
    ],
    expectedDiagnosticCount: 1,
    expectedMessage: 'conflicting routes due to numbered prefixes',
    checkDiagnostic: (diagnostic) => {
      expect(diagnostic).toMatchObject({
        message: expect.stringContaining('conflicting routes due to numbered prefixes'),
        kept: expect.objectContaining({ order: 20 }),
        dropped: expect.objectContaining({ order: 10 }),
      })
    }
  },
  {
    name: 'warns about index/literal conflicts',
    routes: [
      { path: ['docs'], isIndex: true }, // docs/index.md
      { path: ['docs'] }, // docs.md
    ],
    expectedDiagnosticCount: 1,
    expectedMessage: 'conflicting routes',
    checkDiagnostic: (diagnostic) => {
      expect(diagnostic).toMatchObject({
        message: expect.stringContaining('conflicting routes'),
        literal: expect.any(Object),
        index: expect.any(Object),
      })
    }
  },
  {
    name: 'warns about numbered prefix conflicts with same order number',
    routes: [
      { path: ['about'], order: 10 }, // 10_about.md
      { path: ['about'], order: 10 }, // 10-about.md (same order)
    ],
    expectedDiagnosticCount: 1,
    expectedMessage: 'Both files have the same order number (10)',
    checkDiagnostic: (diagnostic) => {
      expect(diagnostic).toMatchObject({
        message: expect.stringContaining('Both files have the same order number (10)'),
        kept: expect.objectContaining({ order: 10 }),
        dropped: expect.objectContaining({ order: 10 }),
      })
    }
  },
], ({ routes, expectedDiagnosticCount, expectedMessage, checkDiagnostic }) => {
  const routeObjects = routes.map(r => createRoute(r.path, r.order, r.isIndex))
  const result = lint(routeObjects)

  expect(result.diagnostics).toHaveLength(expectedDiagnosticCount)

  if (expectedDiagnosticCount > 0 && checkDiagnostic) {
    checkDiagnostic(result.diagnostics[0])
  }
})
