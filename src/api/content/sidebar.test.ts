import { Ar, S } from '#dep/effect'
import { FileRouter } from '#lib/file-router'
import { RouteLogical } from '#lib/file-router/models/route-logical'
import { FsLoc } from '@wollybeard/kit'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { Page } from './page.js'
import type { ScanResult } from './scan.js'
import { buildSidebarIndex } from './sidebar.js'

// Generators
const pathSegmentArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/)
const fileNameArb = fc.oneof(fc.constant('index'), pathSegmentArb)
const pathArb = fc.array(pathSegmentArb, { minLength: 1, maxLength: 4 })

const pageArb: fc.Arbitrary<Page> = pathArb.chain(segments => {
  const fileName = fc.sample(fileNameArb, 1)[0]
  const relativePath = segments.length > 0 ? `${segments.join('/')}/${fileName}.md` : `${fileName}.md`
  const absolutePath = `/pages/${relativePath}`

  return fc.record({
    route: fc.constant(
      new FileRouter.Route({
        logical: RouteLogical.make({
          path: FsLoc.Path.Abs.make({ segments }),
          order: undefined,
        }),
        file: S.decodeSync(FsLoc.AbsFile.String)(absolutePath),
      }),
    ),
    metadata: fc.record({
      hidden: fc.boolean(),
    }),
  })
})

const scanResultArb: fc.Arbitrary<ScanResult> = fc.record({
  list: fc.array(pageArb, { maxLength: 50 }),
  tree: fc.constant({ root: null }), // Tree isn't used in the new implementation
  diagnostics: fc.constant([]),
})

describe('buildSidebarIndex properties', () => {
  it('never includes hidden pages in any sidebar', () => {
    fc.assert(
      fc.property(scanResultArb, (scanResult) => {
        const result = buildSidebarIndex(scanResult)

        // Collect all page paths that appear in sidebars
        const allSidebarPaths = new Set<string>()

        for (const sidebar of Object.values(result)) {
          for (const item of sidebar.items) {
            if (item.type === 'ItemLink') {
              allSidebarPaths.add(item.pathExp)
            } else {
              allSidebarPaths.add(item.pathExp)
              for (const link of item.links) {
                allSidebarPaths.add(link.pathExp)
              }
            }
          }
        }

        // Check that no hidden page appears in sidebars
        const hiddenPagePaths = scanResult.list
          .filter(page => page.metadata.hidden)
          .map(page => page.route.logical.path.segments.join('/'))

        for (const hiddenPath of hiddenPagePaths) {
          expect(allSidebarPaths.has(hiddenPath)).toBe(false)
        }

        return true
      }),
    )
  })

  it('only creates sidebars for directories with index pages', () => {
    fc.assert(
      fc.property(scanResultArb, (scanResult) => {
        const result = buildSidebarIndex(scanResult)

        // Every sidebar key should correspond to a directory with an index page
        for (const sidebarPath of Object.keys(result)) {
          const topLevelDir = sidebarPath.slice(1) // Remove leading '/'

          const hasIndexPage = scanResult.list.some(page =>
            page.route.logical.path.segments.length === 1
            && page.route.logical.path.segments[0] === topLevelDir
            && FsLoc.name(page.route.file).replace(/\.[^.]+$/, '') === 'index'
            && !page.metadata.hidden
          )

          expect(hasIndexPage).toBe(true)
        }

        return true
      }),
    )
  })

  it('all items have valid non-empty titles and paths', () => {
    fc.assert(
      fc.property(scanResultArb, (scanResult) => {
        const result = buildSidebarIndex(scanResult)

        for (const sidebar of Object.values(result)) {
          for (const item of sidebar.items) {
            // Check item has required fields
            expect(item.title).toBeTruthy()
            expect(item.title.length).toBeGreaterThan(0)
            expect(item.pathExp).toBeTruthy()
            expect(item.pathExp.length).toBeGreaterThan(0)

            if (item.type === 'ItemSection') {
              expect(typeof item.isLinkToo).toBe('boolean')
              expect(Ar.isArray(item.links)).toBe(true)

              // Check all links in section
              for (const link of item.links) {
                expect(link.type).toBe('ItemLink')
                expect(link.title).toBeTruthy()
                expect(link.title.length).toBeGreaterThan(0)
                expect(link.pathExp).toBeTruthy()
                expect(link.pathExp.length).toBeGreaterThan(0)
              }
            }
          }
        }

        return true
      }),
    )
  })

  it('sections marked as linkable have corresponding index pages', () => {
    fc.assert(
      fc.property(scanResultArb, (scanResult) => {
        const result = buildSidebarIndex(scanResult)

        for (const sidebar of Object.values(result)) {
          for (const item of sidebar.items) {
            if (item.type === 'ItemSection' && item.isLinkToo) {
              // This section should have an index page
              const hasIndexPage = scanResult.list.some(page =>
                page.route.logical.path.segments.join('/') === item.pathExp
                && FsLoc.name(page.route.file) === 'index'
                && !page.metadata.hidden
              )

              expect(hasIndexPage).toBe(true)
            }
          }
        }

        return true
      }),
    )
  })

  it('no duplicate paths within a sidebar', () => {
    fc.assert(
      fc.property(scanResultArb, (scanResult) => {
        const result = buildSidebarIndex(scanResult)

        for (const sidebar of Object.values(result)) {
          const paths = new Set<string>()

          for (const item of sidebar.items) {
            if (item.type === 'ItemLink') {
              expect(paths.has(item.pathExp)).toBe(false)
              paths.add(item.pathExp)
            } else {
              expect(paths.has(item.pathExp)).toBe(false)
              paths.add(item.pathExp)

              for (const link of item.links) {
                expect(paths.has(link.pathExp)).toBe(false)
                paths.add(link.pathExp)
              }
            }
          }
        }

        return true
      }),
    )
  })

  it('deterministic - same input produces same output', () => {
    fc.assert(
      fc.property(scanResultArb, (scanResult) => {
        const result1 = buildSidebarIndex(scanResult)
        const result2 = buildSidebarIndex(scanResult)

        expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
        return true
      }),
    )
  })

  it('preserves hierarchical relationships', () => {
    fc.assert(
      fc.property(scanResultArb, (scanResult) => {
        const result = buildSidebarIndex(scanResult)

        // For each sidebar, verify that all items belong to that top-level directory
        for (const [sidebarPath, sidebar] of Object.entries(result)) {
          const expectedPrefix = sidebarPath.slice(1) // Remove leading '/'

          const checkPath = (pathExp: string) => {
            const segments = pathExp.split('/')
            expect(segments[0]).toBe(expectedPrefix)
          }

          for (const item of sidebar.items) {
            checkPath(item.pathExp)

            if (item.type === 'ItemSection') {
              for (const link of item.links) {
                checkPath(link.pathExp)
              }
            }
          }
        }

        return true
      }),
    )
  })
})

// Keep a few specific scenario tests for regression
describe('buildSidebarIndex specific scenarios', () => {
  const createPage = (pathSegments: string[], fileName = 'index', hidden = false): Page => {
    const relativePath = pathSegments.length > 0 ? `${pathSegments.join('/')}/${fileName}.md` : `${fileName}.md`
    const absolutePath = `/pages/${relativePath}`

    const route = new FileRouter.Route({
      logical: RouteLogical.make({
        path: FsLoc.Path.Abs.make({ segments: pathSegments }),
        order: undefined,
      }),
      file: S.decodeSync(FsLoc.AbsFile.String)(absolutePath),
    })

    return {
      route,
      metadata: { hidden },
    }
  }

  it('handles empty input', () => {
    const scanResult: ScanResult = {
      list: [],
      tree: { root: null },
      diagnostics: [],
    }
    const result = buildSidebarIndex(scanResult)
    expect(result).toEqual({})
  })

  it('creates sections for nested directories with index pages', () => {
    const pages = [
      createPage(['guide'], 'index'),
      createPage(['guide', 'advanced'], 'index'),
      createPage(['guide', 'advanced', 'tips'], 'tips'),
      createPage(['guide', 'advanced', 'patterns'], 'patterns'),
    ]

    const scanResult: ScanResult = {
      list: pages,
      tree: { root: null },
      diagnostics: [],
    }

    const result = buildSidebarIndex(scanResult)

    expect(result['/guide']).toBeDefined()
    expect(result['/guide']!.items).toHaveLength(1)

    const section = result['/guide']!.items[0]
    expect(section?.type).toBe('ItemSection')

    if (section?.type === 'ItemSection') {
      expect(section.title).toBe('Advanced')
      expect(section.isLinkToo).toBe(true)
      expect(section.links).toHaveLength(2)
    }
  })
})
