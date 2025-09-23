import { Test } from '@wollybeard/kit/test'
import { Document } from 'graphql-kit'
import { describe, expect } from 'vitest'
import type { ExampleName, ExampleSelection } from './config.js'
import { filterExamplesBySelection, shouldDisplayExample } from './filter.js'
import { Example } from './schemas/example/$.js'

describe('filterExamplesBySelection', () => {
  const examples = [
    Example.make({
      name: 'a',
      path: 'a.graphql',
      document: Document.Unversioned.make({ document: 'a' }),
    }),
    Example.make({
      name: 'b',
      path: 'b.graphql',
      document: Document.Unversioned.make({ document: 'b' }),
    }),
    Example.make({
      name: 'c',
      path: 'c.graphql',
      document: Document.Unversioned.make({ document: 'c' }),
    }),
  ]

  type FilterInput = { selection: ExampleSelection | undefined }
  type FilterOutput = { expected: string[] }

  // dprint-ignore
  Test.Table.suite<FilterInput, FilterOutput>('selection filtering', [
    { n: 'undefined returns all',        i: { selection: undefined },                           o: { expected: ['a', 'b', 'c'] } },
    { n: 'all returns all',              i: { selection: 'all' },                               o: { expected: ['a', 'b', 'c'] } },
    { n: 'none returns empty',           i: { selection: 'none' },                              o: { expected: [] } },
    { n: 'include filters',              i: { selection: { include: ['a', 'b'] } },            o: { expected: ['a', 'b'] } },
    { n: 'empty include returns empty',  i: { selection: { include: [] } },                    o: { expected: [] } },
    { n: 'exclude filters',              i: { selection: { exclude: ['c'] } },                 o: { expected: ['a', 'b'] } },
    { n: 'empty exclude returns all',    i: { selection: { exclude: [] } },                    o: { expected: ['a', 'b', 'c'] } },
    { n: 'include ignores non-existent', i: { selection: { include: ['a', 'non-existent'] } }, o: { expected: ['a'] } },
    { n: 'exclude ignores non-existent', i: { selection: { exclude: ['c', 'non-existent'] } }, o: { expected: ['a', 'b'] } },
  ], ({ i, o }) => {
    const result = filterExamplesBySelection(examples, i.selection as ExampleSelection)
    expect(result.map(e => e.name)).toEqual(o.expected)
  })
})

describe('shouldDisplayExample', () => {
  type DisplayInput = { exampleName: ExampleName; selection: ExampleSelection | undefined }
  type DisplayOutput = { expected: boolean }

  // dprint-ignore
  Test.Table.suite<DisplayInput, DisplayOutput>('display logic', [
    { n: 'undefined displays',       i: { exampleName: 'x' as ExampleName, selection: undefined },               o: { expected: true } },
    { n: 'all displays',             i: { exampleName: 'x' as ExampleName, selection: 'all' },                   o: { expected: true } },
    { n: 'none hides',               i: { exampleName: 'x' as ExampleName, selection: 'none' },                  o: { expected: false } },
    { n: 'include match displays',   i: { exampleName: 'x' as ExampleName, selection: { include: ['x'] } },     o: { expected: true } },
    { n: 'include miss hides',       i: { exampleName: 'x' as ExampleName, selection: { include: ['y'] } },     o: { expected: false } },
    { n: 'empty include hides',      i: { exampleName: 'x' as ExampleName, selection: { include: [] } },        o: { expected: false } },
    { n: 'exclude match hides',      i: { exampleName: 'x' as ExampleName, selection: { exclude: ['x'] } },     o: { expected: false } },
    { n: 'exclude miss displays',    i: { exampleName: 'x' as ExampleName, selection: { exclude: ['y'] } },     o: { expected: true } },
    { n: 'empty exclude displays',   i: { exampleName: 'x' as ExampleName, selection: { exclude: [] } },        o: { expected: true } },
  ], ({ i, o }) => {
    expect(shouldDisplayExample(i.exampleName, i.selection as ExampleSelection)).toBe(o.expected)
  })
})
