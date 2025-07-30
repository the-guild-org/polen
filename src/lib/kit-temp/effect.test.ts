import type { Case } from '#lib/kit-temp'
import { EffectKit } from '#lib/kit-temp'
import { S } from '#lib/kit-temp/effect'
import { Ts } from '@wollybeard/kit'
import { expect } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'

// Define test schemas
const Added = S.TaggedStruct('LifecycleEventAdded', {
  schema: S.Unknown,
  revision: S.Unknown,
})

const Removed = S.TaggedStruct('LifecycleEventRemoved', {
  schema: S.Unknown,
  revision: S.Unknown,
})

const LifecycleEvent = S.Union(Added, Removed)

// Create the factory
const make = EffectKit.Schema.UnionAdt.makeMake(LifecycleEvent)

interface MakeMakeTestCase {
  testType: 'basic' | 'invalidTag' | 'complex'
  tag?: string
  data?: any
  shouldThrow?: boolean
  expectedTag?: string
  expectedFields?: Record<string, any>
}

// dprint-ignore
Test.suite<MakeMakeTestCase>('EffectKit.Schema.UnionAdt.makeMake', [
  { name: 'creates Added variant with correct tag',       testType: 'basic',      tag: 'LifecycleEventAdded',    data: { schema: 'test-schema', revision: 'test-revision' }, expectedTag: 'LifecycleEventAdded', expectedFields: { schema: 'test-schema', revision: 'test-revision' } },
  { name: 'creates Removed variant with correct tag',     testType: 'basic',      tag: 'LifecycleEventRemoved',  data: { schema: 'test-schema', revision: 'test-revision' }, expectedTag: 'LifecycleEventRemoved', expectedFields: { schema: 'test-schema', revision: 'test-revision' } },
  { name: 'throws error for unknown tag',                 testType: 'invalidTag', tag: 'UnknownTag',             data: { schema: 'test', revision: 'test' },                 shouldThrow: true },
  { name: 'works with complex field types - Added',       testType: 'complex',    tag: 'ComplexAdded',           data: { name: 'test', count: 42, nested: { value: 'nested-value' } }, expectedTag: 'ComplexAdded', expectedFields: { name: 'test', count: 42, nested: { value: 'nested-value' } } },
  { name: 'works with complex field types - Removed',     testType: 'complex',    tag: 'ComplexRemoved',         data: { reason: 'test reason', timestamp: 123456 },         expectedTag: 'ComplexRemoved', expectedFields: { reason: 'test reason', timestamp: 123456 } },
], ({ testType, tag, data, shouldThrow, expectedTag, expectedFields }) => {
  if (testType === 'basic') {
    const result = make(tag as any, data)
    expect(result._tag).toBe(expectedTag)
    if (expectedFields) {
      Object.entries(expectedFields).forEach(([key, value]) => {
        expect((result as any)[key]).toEqual(value)
      })
    }
  } else if (testType === 'invalidTag') {
    expect(() => {
      make(tag as any, data)
    }).toThrow('Unknown tag: UnknownTag')
  } else if (testType === 'complex') {
    const ComplexAdded = S.TaggedStruct('ComplexAdded', {
      name: S.String,
      count: S.Number,
      nested: S.Struct({
        value: S.String,
      }),
    })

    const ComplexRemoved = S.TaggedStruct('ComplexRemoved', {
      reason: S.String,
      timestamp: S.Number,
    })

    const ComplexUnion = S.Union(ComplexAdded, ComplexRemoved)
    const complexMake = EffectKit.Schema.UnionAdt.makeMake(ComplexUnion)
    
    const result = complexMake(tag as any, data)
    expect(result._tag).toBe(expectedTag)
    if (expectedFields) {
      Object.entries(expectedFields).forEach(([key, value]) => {
        expect((result as any)[key]).toEqual(value)
      })
    }
  }
})

// Re-declare for type tests
namespace _ {
  const Added = S.TaggedStruct('LifecycleEventAdded', {
    schema: S.Unknown,
    revision: S.Unknown,
  })

  const Removed = S.TaggedStruct('LifecycleEventRemoved', {
    schema: S.Unknown,
    revision: S.Unknown,
  })

  const LifecycleEvent = S.Union(Added, Removed)
  const make = EffectKit.Schema.UnionAdt.makeMake(LifecycleEvent)

  type _ = [
    // Test that factory function has correct signature
    Case<
      Ts.AssertExact<
        typeof make,
        EffectKit.Schema.UnionAdt.FnMake<typeof LifecycleEvent>
      >
    >,

    // Test ExtractTags utility type
    Case<
      Ts.AssertExact<
        EffectKit.Schema.UnionAdt.GetTags<typeof LifecycleEvent>,
        'LifecycleEventAdded' | 'LifecycleEventRemoved'
      >
    >,

    // Test ExtractMemberByTag utility type
    // ExtractMemberByTag should return the decoded type of the member
    // The type should have the tag and all fields from the schema

    // Test OmitTag utility type
    Case<
      Ts.AssertExact<
        EffectKit.TaggedStruct.OmitTag<{ _tag: 'test'; field: string }>,
        { field: string }
      >
    >,
  ]
}
