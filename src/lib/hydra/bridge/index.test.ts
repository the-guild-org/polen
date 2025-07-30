import type { Case } from '#lib/kit-temp/other'
import { Ts } from '@wollybeard/kit'
import { describe, expect, test } from 'vitest'
import { UHL } from '../uhl/$.js'
import * as Index from './index.js'

describe('uhlToIndexKey and parseIndexKey', () => {
  // dprint-ignore
  test.for([
      {
        uhl: UHL.make(UHL.makeSegment('Foo', {})),
        expected: 'Foo'
      },
      {
        uhl: UHL.make(UHL.makeSegment('User', { id: 'abc123' })),
        expected: 'User!id@abc123'
      },
      {
        uhl: UHL.make(UHL.makeSegment('SchemaVersioned', { version: '1.0.0' }, 'Schema')),
        expected: 'Schema@SchemaVersioned!version@1.0.0'
      },
      {
        uhl: UHL.make(
          UHL.makeSegment('SchemaVersioned', { version: '1.0.0' }, 'Schema'),
          UHL.makeSegment('RevisionInitial', { date: '2024-01-15' }, 'Revision')
        ),
        expected: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15'
      },
    ])('$expected', ({ uhl, expected }) => {
      const key = Index.uhlToIndexKey(uhl)
      expect(key).toBe(expected)

      // Test round trip
      const parsed = Index.parseIndexKey(key)
      expect(UHL.equivalent(parsed, uhl)).toBe(true)
    })
})

describe('file name conversions', () => {
  // dprint-ignore
  test.for([
      { key: 'Foo', expectedFileName: 'Foo.json' },
      { key: 'User!id@abc123', expectedFileName: 'User!id@abc123.json' },
      { key: 'Schema@SchemaVersioned!version@1.0.0', expectedFileName: 'Schema@SchemaVersioned!version@1.0.0.json' },
    ])('indexKeyToFileName: $key -> $expectedFileName', ({ key, expectedFileName }) => {
      expect(Index.indexKeyToFileName(key)).toBe(expectedFileName)
    })

  // dprint-ignore
  test.for([
      { fileName: 'Foo.json', expectedKey: 'Foo' },
      { fileName: 'User!id@abc123.json', expectedKey: 'User!id@abc123' },
      { fileName: 'Schema@SchemaVersioned!version@1.0.0.json', expectedKey: 'Schema@SchemaVersioned!version@1.0.0' },
    ])('filePathToIndexKey: $fileName -> $expectedKey', ({ fileName, expectedKey }) => {
      expect(Index.filePathToIndexKey(fileName)).toBe(expectedKey)
    })
})

describe('index operations', () => {
  test('make creates empty index', () => {
    const index = Index.make()
    expect(index.data.size).toBe(0)
  })

  test('add and retrieve values', () => {
    const index = Index.make()
    const uhl = UHL.make(UHL.makeSegment('User', { id: 'abc123' }))
    const value = { _tag: 'User', id: 'abc123', name: 'John' }

    Index.add(index, uhl, value)

    const key = Index.uhlToIndexKey(uhl)
    expect(index.data.get(key)).toEqual(value)
  })

  // dprint-ignore
  test.for([
      {
        uhl1: UHL.make(UHL.makeSegment('User', { id: '1' })),
        value1: { _tag: 'User', id: '1', name: 'Alice' },
        uhl2: UHL.make(UHL.makeSegment('User', { id: '2' })),
        value2: { _tag: 'User', id: '2', name: 'Bob' },
      },
      {
        uhl1: UHL.make(UHL.makeSegment('SchemaVersioned', { version: '1.0.0' }, 'Schema')),
        value1: { _tag: 'SchemaVersioned', version: '1.0.0' },
        uhl2: UHL.make(UHL.makeSegment('SchemaVersioned', { version: '2.0.0' }, 'Schema')),
        value2: { _tag: 'SchemaVersioned', version: '2.0.0' },
      },
    ])('multiple entries do not conflict', ({ uhl1, value1, uhl2, value2 }) => {
      const index = Index.make()

      Index.add(index, uhl1, value1)
      Index.add(index, uhl2, value2)

      expect(index.data.size).toBe(2)
      expect(index.data.get(Index.uhlToIndexKey(uhl1))).toEqual(value1)
      expect(index.data.get(Index.uhlToIndexKey(uhl2))).toEqual(value2)
    })
})

// ============================================================================
// Type Tests
// ============================================================================

type _ = [
  // Test index types
  Case<Ts.AssertExtends<Index.Index, { readonly data: Index.IndexData }>>,
  Case<Ts.AssertExtends<Index.IndexData, Map<string, unknown>>>,

  // Test that index entry has required fields
  Case<Ts.AssertExtends<Index.IndexEntry, { readonly key: string; readonly path: string }>>,
]
