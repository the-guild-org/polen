import { Grafaid } from '#lib/grafaid'
import { S } from '#lib/kit-temp'
import * as GraphQLName from '../graphql-name.js'
import * as Field from './field.js'
import * as ResolvedType from './resolved-type.js'

/**
 * GraphQL argument segment in a schema path.
 */

// This path node represents a GraphQL Argument
export const graphqlKind = Grafaid.Schema.Kinds.Kinds.Argument

export interface Argument {
  _tag: 'GraphQLPathSegmentArgument'
  name: string
  next?: ArgumentNext | undefined
}

export type ArgumentNext =
  | Field.Field
  | ResolvedType.ResolvedType

export interface ArgumentEncoded {
  _tag: 'GraphQLPathSegmentArgument'
  name: string
  next?: ArgumentNextEncoded | undefined
}

export type ArgumentNextEncoded =
  | Field.FieldEncoded
  | ResolvedType.ResolvedTypeEncoded

// ============================================================================
// Schema
// ============================================================================

export const Schema = S.TaggedStruct('GraphQLPathSegmentArgument', {
  name: GraphQLName.GraphQLName,
  next: S.optional(S.suspend((): S.Schema<ArgumentNext, ArgumentNextEncoded> =>
    S.Union(
      Field.Schema,
      ResolvedType.Schema,
    )
  )),
})

// Types are manually defined above

// ============================================================================
// Constructors
// ============================================================================

export const make = Schema.make
