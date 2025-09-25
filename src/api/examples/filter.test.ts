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

  // dprint-ignore
  Test.describe('selection filtering')
    .i<{ selection: ExampleSelection | undefined }>()
    .o<string[]>()
    .cases(
      ['undefined returns all',        [{ selection: undefined }],                           ['a', 'b', 'c']],
      ['all returns all',              [{ selection: 'all' }],                               ['a', 'b', 'c']],
      ['none returns empty',           [{ selection: 'none' }],                              []],
      ['include filters',              [{ selection: { include: ['a', 'b'] } }],            ['a', 'b']],
      ['empty include returns empty',  [{ selection: { include: [] } }],                    []],
      ['exclude filters',              [{ selection: { exclude: ['c'] } }],                 ['a', 'b']],
      ['empty exclude returns all',    [{ selection: { exclude: [] } }],                    ['a', 'b', 'c']],
      ['include ignores non-existent', [{ selection: { include: ['a', 'non-existent'] } }], ['a']],
      ['exclude ignores non-existent', [{ selection: { exclude: ['c', 'non-existent'] } }], ['a', 'b']],
    )
    .test((i, o) => {
      const result = filterExamplesBySelection(examples, i.selection as ExampleSelection)
      expect(result.map(e => e.name)).toEqual(o)
    })
})

describe('shouldDisplayExample', () => {
  // dprint-ignore
  Test.describe('display logic')
    .i<{ exampleName: ExampleName; selection: ExampleSelection | undefined }>()
    .o<boolean>()
    .cases(
      ['undefined displays',       [{ exampleName: 'x' as ExampleName, selection: undefined }],               true],
      ['all displays',             [{ exampleName: 'x' as ExampleName, selection: 'all' }],                   true],
      ['none hides',               [{ exampleName: 'x' as ExampleName, selection: 'none' }],                  false],
      ['include match displays',   [{ exampleName: 'x' as ExampleName, selection: { include: ['x'] } }],     true],
      ['include miss hides',       [{ exampleName: 'x' as ExampleName, selection: { include: ['y'] } }],     false],
      ['empty include hides',      [{ exampleName: 'x' as ExampleName, selection: { include: [] } }],        false],
      ['exclude match hides',      [{ exampleName: 'x' as ExampleName, selection: { exclude: ['x'] } }],     false],
      ['exclude miss displays',    [{ exampleName: 'x' as ExampleName, selection: { exclude: ['y'] } }],     true],
      ['empty exclude displays',   [{ exampleName: 'x' as ExampleName, selection: { exclude: [] } }],        true],
    )
    .test((i, o) => {
      expect(shouldDisplayExample(i.exampleName, i.selection as ExampleSelection)).toBe(o)
    })
})
