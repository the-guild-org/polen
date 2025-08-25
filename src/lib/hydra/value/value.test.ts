import { describe, expect, test } from 'vitest'
import { Index } from '../index/$.js'
import { Uhl } from '../uhl/$.js'
import { hydrate } from './value.js'

describe('hydrate', () => {
  test('handles dehydrated objects with nested dehydrated references in uniqueKeys', () => {
    // This test reproduces the error found in sanity check:
    // ParseError: Expected string | number, actual {"_tag":"SchemaVersioned","_dehydrated":true,"version":"2.0.0"}

    // Create an index with some test data
    const index = Index.create()

    // Add a fragment that would be found during hydration
    const parentSchema = { _tag: 'SchemaVersioned', version: '2.0.0', parent: null }
    const parentUhl = Uhl.make(Uhl.Segment.make({ tag: 'SchemaVersioned', uniqueKeys: { version: '2.0.0' } }))
    Index.addFragments(index, [{ uhl: parentUhl, value: parentSchema }])

    // Create a dehydrated value that has a nested dehydrated object as a property
    // This is the problematic case - when a dehydrated value contains another dehydrated object
    // that should NOT be treated as a unique key
    const dehydratedValue = {
      _tag: 'SchemaVersioned',
      _dehydrated: true,
      version: '3.0.0', // This should be treated as a unique key (string)
      parent: { // This should NOT be treated as a unique key (it's a dehydrated object)
        _tag: 'SchemaVersioned',
        _dehydrated: true,
        version: '2.0.0',
      },
    }

    // This should not throw an error
    // The hydrate function should filter out nested dehydrated objects from uniqueKeys
    expect(() => {
      const result = hydrate(dehydratedValue, index)

      // The result should be the dehydrated value as-is since we don't have the actual hydrated version in the index
      expect(result).toEqual(dehydratedValue)
    }).not.toThrow()
  })

  test('correctly identifies dehydrated objects vs primitive values for uniqueKeys', () => {
    const index = Index.create()

    // Test data with mixed property types
    const dehydratedValue = {
      _tag: 'TestSchema',
      _dehydrated: true,
      stringKey: 'test', // Should be included in uniqueKeys
      numberKey: 42, // Should be included in uniqueKeys
      nestedDehydrated: { // Should NOT be included in uniqueKeys
        _tag: 'NestedSchema',
        _dehydrated: true,
        id: 'nested-1',
      },
      nestedObject: { // Should NOT be included in uniqueKeys (not dehydrated but still object)
        someProperty: 'value',
      },
    }

    // This should not throw - the function should only use primitive values for UHL generation
    expect(() => {
      hydrate(dehydratedValue, index)
    }).not.toThrow()
  })

  test('filters out non-primitive values when building UHL segments', () => {
    // This test ensures that when we extract uniqueKeys from a dehydrated value,
    // we only include primitive values (string, number) and exclude objects

    const dehydratedValue = {
      _tag: 'ComplexSchema',
      _dehydrated: true,
      id: 'schema-123', // primitive - should be included
      version: 1.0, // primitive - should be included
      metadata: { // object - should be excluded
        created: '2024-01-01',
      },
      parent: { // dehydrated object - should be excluded
        _tag: 'ParentSchema',
        _dehydrated: true,
        id: 'parent-456',
      },
      tags: ['tag1', 'tag2'], // array - should be excluded
      isActive: true, // boolean - should be excluded (UHL only supports string|number)
    }

    const index = Index.create()

    // The key insight: the function should not fail when trying to create UHL segments
    // because it should filter out complex values and only use primitives
    expect(() => {
      hydrate(dehydratedValue, index)
    }).not.toThrow()
  })
})
