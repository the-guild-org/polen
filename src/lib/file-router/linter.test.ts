import { describe, expect, test } from 'vitest'
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
  }
}

describe('linter', () => {
  test('warns about numbered prefix on index files', () => {
    const routes: Route[] = [
      createRoute(['docs'], 10, true), // 10_index.md
      createRoute(['docs', 'getting-started']),
    ]

    const result = lint(routes)

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]).toMatchObject({
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
  })

  test('no warning for index files without numbered prefix', () => {
    const routes: Route[] = [
      createRoute(['docs'], undefined, true), // index.md
      createRoute(['docs', 'getting-started']),
    ]

    const result = lint(routes)

    expect(result.diagnostics).toHaveLength(0)
  })

  test('warns about numbered prefix conflicts', () => {
    const routes: Route[] = [
      createRoute(['about'], 10), // 10_about.md
      createRoute(['about'], 20), // 20_about.md
    ]

    const result = lint(routes)

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]).toMatchObject({
      message: expect.stringContaining('conflicting routes due to numbered prefixes'),
      kept: expect.objectContaining({ order: 20 }),
      dropped: expect.objectContaining({ order: 10 }),
    })
  })

  test('warns about index/literal conflicts', () => {
    const routes: Route[] = [
      createRoute(['docs'], undefined, true), // docs/index.md
      createRoute(['docs']), // docs.md
    ]

    const result = lint(routes)

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]).toMatchObject({
      message: expect.stringContaining('conflicting routes'),
      literal: expect.any(Object),
      index: expect.any(Object),
    })
  })

  test('warns about numbered prefix conflicts with same order number', () => {
    const routes: Route[] = [
      createRoute(['about'], 10), // 10_about.md
      createRoute(['about'], 10), // 10-about.md (same order)
    ]

    const result = lint(routes)

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]).toMatchObject({
      message: expect.stringContaining('Both files have the same order number (10)'),
      kept: expect.objectContaining({ order: 10 }),
      dropped: expect.objectContaining({ order: 10 }),
    })
  })
})
