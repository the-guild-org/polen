import { Tree } from '#lib/tree/index'
import { describe, expect, test } from 'vitest'
import type { RouteTreeNode, RouteTreeNodeValue } from '../scan-tree.ts'
import { buildFromTree } from './sidebar-tree.ts'

// Helper to create mock routes
const mockRoute = (path: string[]) => ({
  logical: { path },
  file: {
    path: {
      absolute: { root: '/', dir: '/', base: 'file.md', ext: '.md', name: 'file' },
      relative: { root: '', dir: '', base: 'file.md', ext: '.md', name: 'file' },
    },
  },
})

// Helper to create file node
const fileNode = (name: string, route: any): RouteTreeNode =>
  Tree.node<RouteTreeNodeValue>({ name, type: 'file', route })

// Helper to create directory node
const dirNode = (name: string, children: RouteTreeNode[] = []): RouteTreeNode =>
  Tree.node<RouteTreeNodeValue>({ name, type: 'directory' }, children)

describe('sidebar-tree', () => {
  test('builds sidebar from simple tree', () => {
    const tree = dirNode('root', [
      fileNode('getting-started', mockRoute(['getting-started'])),
      dirNode('guide', [
        fileNode('introduction', mockRoute(['guide', 'introduction'])),
        fileNode('basics', mockRoute(['guide', 'basics'])),
      ]),
    ])

    const sidebar = buildFromTree(tree, [])

    expect(sidebar.items).toHaveLength(2)
    expect(sidebar.items[0]).toMatchObject({
      type: 'ItemLink',
      pathExp: 'getting-started',
      title: 'Getting Started',
    })
    const section = sidebar.items[1]
    expect(section).toBeDefined()
    expect(section!.type).toBe('ItemSection')
    if (section!.type === 'ItemSection') {
      expect(section).toMatchObject({
        type: 'ItemSection',
        title: 'Guide',
        pathExp: 'guide',
        isLinkToo: false,
      })
      expect(section!.links).toHaveLength(2)
    }
  })

  test('handles index files correctly', () => {
    const tree = dirNode('root', [
      dirNode('guide', [
        fileNode('index', mockRoute(['guide'])),
        fileNode('introduction', mockRoute(['guide', 'introduction'])),
      ]),
    ])

    const sidebar = buildFromTree(tree, [])

    expect(sidebar.items).toHaveLength(1)
    const section = sidebar.items[0]
    expect(section).toBeDefined()
    expect(section!.type).toBe('ItemSection')
    if (section!.type === 'ItemSection') {
      expect(section).toMatchObject({
        type: 'ItemSection',
        title: 'Guide',
        pathExp: 'guide',
        isLinkToo: true, // Should be true because of index file
      })
      expect(section!.links).toHaveLength(1) // Only introduction, not index
    }
  })

  test('respects node ordering from tree', () => {
    const tree = dirNode('root', [
      Tree.node<RouteTreeNodeValue>({ name: 'quickstart', order: 5, type: 'file', route: mockRoute(['quickstart']) }),
      Tree.node<RouteTreeNodeValue>({ name: 'guide', order: 10, type: 'file', route: mockRoute(['guide']) }),
      fileNode('api', mockRoute(['api'])),
      fileNode('troubleshooting', mockRoute(['troubleshooting'])),
    ])

    const sidebar = buildFromTree(tree, [])

    // Tree should already be sorted, so sidebar should maintain that order
    const titles = sidebar.items.map(item => item.title)
    expect(titles).toEqual(['Quickstart', 'Guide', 'Api', 'Troubleshooting'])
  })

  test('handles nested directories', () => {
    const tree = dirNode('root', [
      dirNode('guide', [
        fileNode('intro', mockRoute(['guide', 'intro'])),
        dirNode('advanced', [
          fileNode('performance', mockRoute(['guide', 'advanced', 'performance'])),
          fileNode('optimization', mockRoute(['guide', 'advanced', 'optimization'])),
        ]),
      ]),
    ])

    const sidebar = buildFromTree(tree, [])

    expect(sidebar.items).toHaveLength(1)
    const guideSection = sidebar.items[0]
    expect(guideSection).toBeDefined()
    expect(guideSection!.type).toBe('ItemSection')
    if (guideSection!.type === 'ItemSection') {
      expect(guideSection!.links).toHaveLength(3) // intro + 2 from advanced subdirectory

      const navTitles = guideSection!.links.map(nav => nav.title)
      expect(navTitles).toContain('Intro')
      expect(navTitles).toContain('Performance')
      expect(navTitles).toContain('Optimization')
    }
  })
})
