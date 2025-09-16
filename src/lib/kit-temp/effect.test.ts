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

// Test ExtractTaggedStruct and DoesTaggedUnionContainTag type utilities
namespace TaggedStructUtilityTests {
  declare let _: any

  // Test 1: ExtractTaggedStruct - extract specific schemas from union
  const UserCreated = S.TaggedStruct('UserCreated', { userId: S.String })
  const UserDeleted = S.TaggedStruct('UserDeleted', { userId: S.String })
  const UserUpdated = S.TaggedStruct('UserUpdated', { userId: S.String, name: S.String })

  const SimpleUnion = S.Union(UserCreated, UserDeleted, UserUpdated)

  // Test ExtractTaggedStruct returns the correct schema or never
  type ExtractTests = [
    // Should extract UserCreated
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.ExtractByTag<'UserCreated', typeof SimpleUnion>,
        typeof UserCreated
      >
    >,
    // Should extract UserDeleted
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.ExtractByTag<'UserDeleted', typeof SimpleUnion>,
        typeof UserDeleted
      >
    >,
    // Should return never for non-existent tag
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.ExtractByTag<'UserArchived', typeof SimpleUnion>,
        never
      >
    >,
  ]

  // Test DoesTaggedUnionContainTag predicate
  type PredicateTests = [
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'UserCreated', typeof SimpleUnion>, true>
    >,
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'UserDeleted', typeof SimpleUnion>, true>
    >,
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'UserUpdated', typeof SimpleUnion>, true>
    >,
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'UserArchived', typeof SimpleUnion>, false>
    >,
  ]

  // Test 2: Single TaggedStruct (not a union)
  const SingleStruct = S.TaggedStruct('SingleStruct', { data: S.String })
  type _Single = [
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'SingleStruct', typeof SingleStruct>, true>
    >,
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'OtherStruct', typeof SingleStruct>, false>
    >,
  ]

  // Test 3: GraphQL schema path node types
  const Argument = S.TaggedStruct('GraphQLPathSegmentArgument', { name: S.String })
  const OutputField = S.TaggedStruct('GraphQLPathSegmentOutputField', { name: S.String })
  const Directive = S.TaggedStruct('GraphQLPathSegmentDirective', { name: S.String })

  const NodeUnion = S.Union(Argument, OutputField, Directive)
  type _Nodes = [
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'GraphQLPathSegmentArgument', typeof NodeUnion>,
        true
      >
    >,
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'GraphQLPathSegmentOutputField', typeof NodeUnion>,
        true
      >
    >,
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'GraphQLPathSegmentDirective', typeof NodeUnion>,
        true
      >
    >,
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'GraphQLPathSegmentInputField', typeof NodeUnion>,
        false
      >
    >,
  ]

  // Test 4: Complex tag formats
  const CamelCase = S.TaggedStruct('CamelCaseTag', { a: S.String })
  const SnakeCase = S.TaggedStruct('snake_case_tag', { b: S.Number })
  const KebabCase = S.TaggedStruct('kebab-case-tag', { c: S.Boolean })
  const MixedCase = S.TaggedStruct('Mixed_Case-Tag', { d: S.Unknown })

  const ComplexUnion = S.Union(CamelCase, SnakeCase, KebabCase, MixedCase)
  type _Complex = [
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'CamelCaseTag', typeof ComplexUnion>, true>
    >,
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'snake_case_tag', typeof ComplexUnion>,
        true
      >
    >,
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'kebab-case-tag', typeof ComplexUnion>,
        true
      >
    >,
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'Mixed_Case-Tag', typeof ComplexUnion>,
        true
      >
    >,
  ]

  // Test 5: Suspend unwrapping in unions
  const DirectEvent = S.TaggedStruct('DirectEvent', { value: S.Number })
  const SuspendedEvent = S.TaggedStruct('SuspendedEvent', { data: S.String })

  // Create suspended versions
  const SuspendedDirectEvent = S.suspend((): typeof DirectEvent => DirectEvent)
  const SuspendedSuspendedEvent = S.suspend((): typeof SuspendedEvent => SuspendedEvent)

  // Test with union containing suspended schemas
  const SuspendUnion = S.Union(SuspendedDirectEvent, SuspendedSuspendedEvent)
  type _Suspend = [
    // Should find DirectEvent even though it's wrapped in suspend
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'DirectEvent', typeof SuspendUnion>, true>
    >,
    // Should find SuspendedEvent even though it's wrapped in suspend
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'SuspendedEvent', typeof SuspendUnion>,
        true
      >
    >,
    // Should not find non-existent tag
    Case<
      Ts.AssertExact<
        EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'NonExistentEvent', typeof SuspendUnion>,
        false
      >
    >,
  ]

  // Test 6: Mixed suspended and direct schemas
  const MixedA = S.TaggedStruct('MixedA', { id: S.String })
  const MixedB = S.TaggedStruct('MixedB', { id: S.Number })
  const MixedC = S.TaggedStruct('MixedC', { id: S.Boolean })
  const SuspendedMixedC = S.suspend(() => MixedC)

  const MixedSuspendUnion = S.Union(MixedA, MixedB, SuspendedMixedC)
  type _MixedSuspend = [
    // Should find direct schemas
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'MixedA', typeof MixedSuspendUnion>, true>
    >,
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'MixedB', typeof MixedSuspendUnion>, true>
    >,
    // Should find suspended schema
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'MixedC', typeof MixedSuspendUnion>, true>
    >,
    // Should not find non-existent
    Case<
      Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'MixedD', typeof MixedSuspendUnion>, false>
    >,
  ]
}
