import { S } from '#dep/effect'
import { FileRouter } from '#lib/file-router'
import { RouteLogical } from '#lib/file-router/models/route-logical'
import { FsLoc } from '@wollybeard/kit'
import { describe, expect, it } from 'vitest'
import { createNavbar } from './navbar.js'
import type { Page } from './page.js'

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

describe('createNavbar', () => {
  it('returns empty for empty input', () => {
    expect(createNavbar([])).toEqual([])
  })

  it('excludes hidden pages', () => {
    const pages = [createPage(['visible'], 'index', false), createPage(['hidden'], 'index', true)]
    const result = createNavbar(pages)
    expect(result).toEqual([{ pathExp: '/visible', title: 'Visible', position: 'right' }])
  })

  it('includes directories with index pages', () => {
    const pages = [createPage(['guide'], 'index'), createPage(['guide', 'intro'], 'intro')]
    const result = createNavbar(pages)
    expect(result).toEqual([{ pathExp: '/guide', title: 'Guide', position: 'right' }])
  })

  it('excludes directories without index pages', () => {
    const pages = [createPage(['guide', 'intro'], 'intro')]
    const result = createNavbar(pages)
    expect(result).toEqual([])
  })

  it('includes single top-level pages', () => {
    const pages = [createPage(['about'], 'about')]
    const result = createNavbar(pages)
    expect(result).toEqual([{ pathExp: '/about', title: 'About', position: 'right' }])
  })

  it('sorts results alphabetically', () => {
    const pages = [createPage(['zebra'], 'zebra'), createPage(['alpha'], 'alpha')]
    const result = createNavbar(pages)
    expect(result[0]!.title).toBe('Alpha')
    expect(result[1]!.title).toBe('Zebra')
  })
})
