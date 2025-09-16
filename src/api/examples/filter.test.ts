import { Document } from '#lib/document/$'
import { describe, expect } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
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

  // dprint-ignore
  Test.suite<{ selection: ExampleSelection | undefined; expected: string[] }>('selection filtering', [
    { name: 'undefined returns all',        selection: undefined,                           expected: ['a', 'b', 'c'] },
    { name: 'all returns all',              selection: 'all',                               expected: ['a', 'b', 'c'] },
    { name: 'none returns empty',           selection: 'none',                              expected: [] },
    { name: 'include filters',              selection: { include: ['a', 'b'] },            expected: ['a', 'b'] },
    { name: 'empty include returns empty',  selection: { include: [] },                    expected: [] },
    { name: 'exclude filters',              selection: { exclude: ['c'] },                 expected: ['a', 'b'] },
    { name: 'empty exclude returns all',    selection: { exclude: [] },                    expected: ['a', 'b', 'c'] },
    { name: 'include ignores non-existent', selection: { include: ['a', 'non-existent'] }, expected: ['a'] },
    { name: 'exclude ignores non-existent', selection: { exclude: ['c', 'non-existent'] }, expected: ['a', 'b'] },
  ], ({ selection, expected }) => {
    const result = filterExamplesBySelection(examples, selection as ExampleSelection)
    expect(result.map(e => e.name)).toEqual(expected)
  })
})

describe('shouldDisplayExample', () => {
  // dprint-ignore
  Test.suite<{ exampleName: ExampleName; selection: ExampleSelection | undefined; expected: boolean }>('display logic', [
    { name: 'undefined displays',       exampleName: 'x' as ExampleName, selection: undefined,               expected: true },
    { name: 'all displays',             exampleName: 'x' as ExampleName, selection: 'all',                   expected: true },
    { name: 'none hides',               exampleName: 'x' as ExampleName, selection: 'none',                  expected: false },
    { name: 'include match displays',   exampleName: 'x' as ExampleName, selection: { include: ['x'] },     expected: true },
    { name: 'include miss hides',       exampleName: 'x' as ExampleName, selection: { include: ['y'] },     expected: false },
    { name: 'empty include hides',      exampleName: 'x' as ExampleName, selection: { include: [] },        expected: false },
    { name: 'exclude match hides',      exampleName: 'x' as ExampleName, selection: { exclude: ['x'] },     expected: false },
    { name: 'exclude miss displays',    exampleName: 'x' as ExampleName, selection: { exclude: ['y'] },     expected: true },
    { name: 'empty exclude displays',   exampleName: 'x' as ExampleName, selection: { exclude: [] },        expected: true },
  ], ({ exampleName, selection, expected }) => {
    expect(shouldDisplayExample(exampleName, selection as ExampleSelection)).toBe(expected)
  })
})
