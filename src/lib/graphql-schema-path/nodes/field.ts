import { Grafaid } from '#lib/grafaid'
import { S } from '#lib/kit-temp'
import * as GraphQLName from '../graphql-name.js'
import * as Argument from './argument.js'
import * as ResolvedType from './resolved-type.js'

/**
 * GraphQL field segment in a schema path.
 */

// This path node represents a GraphQL Field
export const graphqlKind = Grafaid.Schema.Kinds.Kinds.Field

export interface Field {
  _tag: 'GraphQLPathSegmentField'
  name: string
  next?: FieldNext | undefined
}

export type FieldNext =
  | Field
  | Argument.Argument
  | ResolvedType.ResolvedType

export interface FieldEncoded {
  _tag: 'GraphQLPathSegmentField'
  name: string
  next?: FieldNextEncoded | undefined
}

export type FieldNextEncoded =
  | FieldEncoded
  | Argument.ArgumentEncoded
  | ResolvedType.ResolvedTypeEncoded

// ============================================================================
// Schema
// ============================================================================

export const Schema = S.TaggedStruct('GraphQLPathSegmentField', {
  name: GraphQLName.GraphQLName,
  next: S.optional(S.suspend((): S.Schema<FieldNext, FieldNextEncoded> =>
    S.Union(
      Schema,
      Argument.Schema,
      ResolvedType.Schema,
    )
  )),
})

// ============================================================================
// Constructors
// ============================================================================

export const make = Schema.make
