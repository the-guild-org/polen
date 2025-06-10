import { describe, expect, test } from 'vitest'
import * as Tree from './tree.js'

describe('Tree', () => {
  const sampleTree = Tree.node('root', [
    Tree.node('a', [
      Tree.node('a1'),
      Tree.node('a2'),
    ]),
    Tree.node('b', [
      Tree.node('b1'),
    ]),
    Tree.node('c'),
  ])

  test('node creates a tree node', () => {
    const leaf = Tree.node('leaf')
    expect(leaf).toEqual({ value: 'leaf', children: [] })

    const parent = Tree.node('parent', [leaf])
    expect(parent).toEqual({ value: 'parent', children: [leaf] })
  })

  test('map transforms node values', () => {
    const upperTree = Tree.map(sampleTree, value => value.toUpperCase())

    expect(upperTree.value).toBe('ROOT')
    expect(upperTree.children[0]!.value).toBe('A')
    expect(upperTree.children[0]!.children[0]!.value).toBe('A1')
  })

  test('map provides depth and path', () => {
    const depths: number[] = []
    const paths: string[][] = []

    Tree.map(sampleTree, (value, depth, path) => {
      depths.push(depth)
      paths.push(path)
      return value
    })

    expect(depths).toEqual([0, 1, 2, 2, 1, 2, 1])
    expect(paths[0]).toEqual([])
    expect(paths[1]).toEqual(['root'])
    expect(paths[2]).toEqual(['root', 'a'])
  })

  test('visit traverses all nodes', () => {
    const visited: string[] = []
    Tree.visit(sampleTree, node => visited.push(node.value))

    expect(visited).toEqual(['root', 'a', 'a1', 'a2', 'b', 'b1', 'c'])
  })

  test('find locates node', () => {
    const found = Tree.find(sampleTree, value => value === 'b1')
    expect(found?.value).toBe('b1')

    const notFound = Tree.find(sampleTree, value => value === 'x')
    expect(notFound).toBeUndefined()
  })

  test('filter removes non-matching nodes', () => {
    const filtered = Tree.filter(sampleTree, value => !value.includes('2'))

    expect(filtered).toBeDefined()
    expect(Tree.flatten(filtered!)).toEqual(['root', 'a', 'a1', 'b', 'b1', 'c'])
  })

  test('sort orders children', () => {
    const sorted = Tree.sort(sampleTree, (a, b) => b.localeCompare(a))

    expect(sorted.children.map(c => c.value)).toEqual(['c', 'b', 'a'])
    expect(sorted.children[2]!.children.map(c => c.value)).toEqual(['a2', 'a1'])
  })

  test('flatten returns all values', () => {
    const flat = Tree.flatten(sampleTree)
    expect(flat).toEqual(['root', 'a', 'a1', 'a2', 'b', 'b1', 'c'])
  })

  test('depth calculates tree depth', () => {
    expect(Tree.depth(Tree.node('single'))).toBe(0)
    expect(Tree.depth(sampleTree)).toBe(2)
  })

  test('count counts all nodes', () => {
    expect(Tree.count(Tree.node('single'))).toBe(1)
    expect(Tree.count(sampleTree)).toBe(7)
  })

  test('isLeaf identifies leaf nodes', () => {
    expect(Tree.isLeaf(sampleTree)).toBe(false)
    expect(Tree.isLeaf(sampleTree.children[0]!)).toBe(false)
    expect(Tree.isLeaf(sampleTree.children[0]!.children[0]!)).toBe(true)
  })

  test('leaves gets all leaf nodes', () => {
    const leafNodes = Tree.leaves(sampleTree)
    expect(leafNodes.map(n => n.value)).toEqual(['a1', 'a2', 'b1', 'c'])
  })

  test('fromList builds tree from flat list', () => {
    const items = [
      { id: '1', name: 'root' },
      { id: '2', parentId: '1', name: 'child1' },
      { id: '3', parentId: '1', name: 'child2' },
      { id: '4', parentId: '2', name: 'grandchild' },
    ]

    const trees = Tree.fromList(items, undefined)
    expect(trees).toHaveLength(1)
    expect(trees[0]!.value.name).toBe('root')
    expect(trees[0]!.children).toHaveLength(2)
    expect(trees[0]!.children[0]!.children[0]!.value.name).toBe('grandchild')
  })
})
