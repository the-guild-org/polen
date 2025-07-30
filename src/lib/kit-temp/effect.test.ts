import type { Case } from '#lib/kit-temp'
import { EffectKit } from '#lib/kit-temp'
import { S } from '#lib/kit-temp/effect'
import { Ts } from '@wollybeard/kit'
import { describe, expect, it } from 'vitest'

describe('EffectKit.Schema.UnionAdt.makeMake', () => {
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

  it('creates union members with correct tag', () => {
    const testData = { schema: 'test-schema', revision: 'test-revision' }

    // Test Added variant
    const added = make('LifecycleEventAdded', testData)
    expect(added._tag).toBe('LifecycleEventAdded')
    expect(added.schema).toBe('test-schema')
    expect(added.revision).toBe('test-revision')

    // Test Removed variant
    const removed = make('LifecycleEventRemoved', testData)
    expect(removed._tag).toBe('LifecycleEventRemoved')
    expect(removed.schema).toBe('test-schema')
    expect(removed.revision).toBe('test-revision')
  })

  it('throws error for unknown tag', () => {
    expect(() => {
      // @ts-expect-error - Testing invalid tag
      make('UnknownTag', { schema: 'test', revision: 'test' })
    }).toThrow('Unknown tag: UnknownTag')
  })

  it('works with complex field types', () => {
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

    const added = complexMake('ComplexAdded', {
      name: 'test',
      count: 42,
      nested: { value: 'nested-value' },
    })

    expect(added._tag).toBe('ComplexAdded')
    expect((added as any).name).toBe('test')
    expect((added as any).count).toBe(42)
    expect((added as any).nested).toEqual({ value: 'nested-value' })

    const removed = complexMake('ComplexRemoved', {
      reason: 'test reason',
      timestamp: 123456,
    })

    expect(removed._tag).toBe('ComplexRemoved')
    expect((removed as any).reason).toBe('test reason')
    expect((removed as any).timestamp).toBe(123456)
  })
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
