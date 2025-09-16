import type { Case } from '#lib/kit-temp'
import { Ts } from '@wollybeard/kit'
import { type GetStepperInputTargetNode } from './define.js'

// ============================================================================
// Test Mapping - simulating the graphql-schema traverser
// ============================================================================

type MockTargetMapping = {
  context: { foo: true }
  nodes: {
    GraphQLPathSegmentArgument: { a: 1 }
    GraphQLPathSegmentField: { b: 2 }
    GraphQLPathSegmentType: { d: 4 }
    GraphQLPathSegmentResolvedType: { e: 5 }
  }
}

// ============================================================================
// InferTargetParentNode Tests
// ============================================================================

type _GetStepperInputTargetNode = [
  // Type's parent is Root, which is not in the mapping
  // So targetParentNode should be never
  Case<
    Ts.AssertExact<
      GetStepperInputTargetNode<MockTargetMapping, 'GraphQLPathSegmentType'>,
      never
    >
  >,

  // Argument's parents are Field and Directive, both are mapped
  // So targetParentNode should be { b: 2 } | { c: 3 }
  Case<
    Ts.AssertExact<
      GetStepperInputTargetNode<MockTargetMapping, 'GraphQLPathSegmentArgument'>,
      { b: 2 }
    >
  >,

  // Field's parents are Type, Field, and Argument
  // All are mapped, so targetParentNode should be their union
  Case<
    Ts.AssertExact<
      GetStepperInputTargetNode<MockTargetMapping, 'GraphQLPathSegmentField'>,
      { d: 4 } | { b: 2 } | { a: 1 }
    >
  >,

  // ResolvedType's parents are Field and Argument
  // Both are mapped
  Case<
    Ts.AssertExact<
      GetStepperInputTargetNode<MockTargetMapping, 'GraphQLPathSegmentResolvedType'>,
      { b: 2 } | { a: 1 }
    >
  >,
]
