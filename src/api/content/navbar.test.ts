import { describe, expect, it } from 'vitest'
import { createNavbar } from './navbar.js'
import type { Page } from './page.js'

const createPage = (path: string[], fileName = 'index', hidden = false): Page => ({
  route: {
    id: path.join('/'),
    parentId: path.length > 1 ? path.slice(0, -1).join('/') : null,
    logical: { path },
    file: {
      path: {
        absolute: { root: '/', dir: `/pages/${path.join('/')}`, base: `${fileName}.md`, ext: '.md', name: fileName },
        relative: { root: '', dir: path.join('/'), base: `${fileName}.md`, ext: '.md', name: fileName },
      },
    },
  },
  metadata: { description: undefined, hidden },
})

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
