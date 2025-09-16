import { Grafaid } from '#lib/grafaid'
import { S } from '#lib/kit-temp'
import * as GraphQLName from '../graphql-name.js'
import * as Field from './field.js'

/**
 * GraphQL type segment in a schema path.
 * Represents a reference to a GraphQL type (Object, Interface, Union, Enum, Scalar, Input).
 */

// This path node can represent any named type
// The actual kind is determined at runtime when traversing
export const graphqlKinds = Grafaid.Schema.Kinds.Like.Named

// ============================================================================
// Type Definitions
// ============================================================================

export interface Type {
  _tag: 'GraphQLPathSegmentType'
  name: string
  next?: TypeNext | undefined
}

export type TypeNext = Field.Field

export interface TypeEncoded {
  _tag: 'GraphQLPathSegmentType'
  name: string
  next?: TypeNextEncoded | undefined
}

export type TypeNextEncoded = Field.FieldEncoded

// ============================================================================
// Schema
// ============================================================================

export const Schema = S.TaggedStruct('GraphQLPathSegmentType', {
  name: GraphQLName.GraphQLName,
  next: S.optional(S.suspend((): S.Schema<TypeNext, TypeNextEncoded> => Field.Schema)),
})

// Types are manually defined above

// ============================================================================
// Constructors
// ============================================================================

export const make = Schema.make
