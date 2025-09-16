import { S } from '#lib/kit-temp'

/**
 * GraphQL resolved type segment in a schema path.
 * Represents the final type resolution in a field path.
 *
 * This is a terminal node - it has no next segment.
 * Used to indicate "resolve to the actual type" in paths like:
 * - User.posts# (resolve the type of posts field)
 */

// This is not a GraphQL kind itself, but a traversal operation
// It represents "resolve to the named type" of a field or argument
// No graphqlKind export as this is a meta-operation

export interface ResolvedType {
  _tag: 'GraphQLPathSegmentResolvedType'
  next?: undefined
}

export interface ResolvedTypeEncoded {
  _tag: 'GraphQLPathSegmentResolvedType'
  next?: undefined
}

// ============================================================================
// Schema
// ============================================================================

export const Schema = S.TaggedStruct('GraphQLPathSegmentResolvedType', {
  next: S.optional(S.Undefined),
})

// Types are manually defined above

// ============================================================================
// Constructors
// ============================================================================

export const make = Schema.make
