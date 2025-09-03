import { describe, expect, test } from 'vitest'
import type { ExampleName, ExampleSelection } from './config.js'
import { filterExamplesBySelection, shouldDisplayExample } from './filter.js'
import { Unversioned } from './schemas/example/unversioned.js'

describe('filterExamplesBySelection', () => {
  const examples = [
    Unversioned.make({ name: 'a', path: 'a.graphql', document: 'a' }),
    Unversioned.make({ name: 'b', path: 'b.graphql', document: 'b' }),
    Unversioned.make({ name: 'c', path: 'c.graphql', document: 'c' }),
  ]

  test.for([
    { selection: undefined, expected: ['a', 'b', 'c'] },
    { selection: 'all', expected: ['a', 'b', 'c'] },
    { selection: 'none', expected: [] },
    { selection: { include: ['a', 'b'] }, expected: ['a', 'b'] },
    { selection: { include: [] }, expected: [] },
    { selection: { exclude: ['c'] }, expected: ['a', 'b'] },
    { selection: { exclude: [] }, expected: ['a', 'b', 'c'] },
    { selection: { include: ['a', 'non-existent'] }, expected: ['a'] },
    { selection: { exclude: ['c', 'non-existent'] }, expected: ['a', 'b'] },
  ])('selection $selection returns $expected', ({ selection, expected }) => {
    const result = filterExamplesBySelection(examples, selection as ExampleSelection)
    expect(result.map(e => e.name)).toEqual(expected)
  })
})

describe('shouldDisplayExample', () => {
  test.for([
    { name: 'x' as ExampleName, selection: undefined, expected: true },
    { name: 'x' as ExampleName, selection: 'all', expected: true },
    { name: 'x' as ExampleName, selection: 'none', expected: false },
    { name: 'x' as ExampleName, selection: { include: ['x'] }, expected: true },
    { name: 'x' as ExampleName, selection: { include: ['y'] }, expected: false },
    { name: 'x' as ExampleName, selection: { include: [] }, expected: false },
    { name: 'x' as ExampleName, selection: { exclude: ['x'] }, expected: false },
    { name: 'x' as ExampleName, selection: { exclude: ['y'] }, expected: true },
    { name: 'x' as ExampleName, selection: { exclude: [] }, expected: true },
  ])('name "$name" with selection $selection returns $expected', ({ name, selection, expected }) => {
    expect(shouldDisplayExample(name, selection as ExampleSelection)).toBe(expected)
  })
})
