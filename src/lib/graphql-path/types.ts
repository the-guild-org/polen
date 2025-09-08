/**
 * GraphQL Path type definitions using Effect Schema
 */

import { S } from '#lib/kit-temp/effect'
import { ParseResult } from 'effect'

// ============================================================================
// Schema
// ============================================================================

/**
 * Segment representing a GraphQL type in a path
 */
export const TypeSegment = S.TaggedStruct('TypeSegment', {
  type: S.String,
})

export type TypeSegment = S.Schema.Type<typeof TypeSegment>

// Type guard derived from Effect Schema
export const isTypeSegment = S.is(TypeSegment)

/**
 * Segment representing a field in a path
 */
export const FieldSegment = S.TaggedStruct('FieldSegment', {
  field: S.String,
})

export type FieldSegment = S.Schema.Type<typeof FieldSegment>

// Type guard derived from Effect Schema
export const isFieldSegment = S.is(FieldSegment)

/**
 * Segment representing an argument in a path
 */
export const ArgumentSegment = S.TaggedStruct('ArgumentSegment', {
  argument: S.String,
})

export type ArgumentSegment = S.Schema.Type<typeof ArgumentSegment>

// Type guard derived from Effect Schema
export const isArgumentSegment = S.is(ArgumentSegment)

/**
 * Union of all possible segments
 */
export const Segment = S.Union(TypeSegment, FieldSegment, ArgumentSegment)

export type Segment = S.Schema.Type<typeof Segment>

// Type guard derived from Effect Schema
export const isSegment = S.is(Segment)

/**
 * Query segments - only types and fields can be traversed in queries
 * Arguments cannot be part of query paths as they are not traversable
 */
export const QuerySegment = S.Union(TypeSegment, FieldSegment)

export type QuerySegment = S.Schema.Type<typeof QuerySegment>

// Type guard derived from Effect Schema
export const isQuerySegment = S.is(QuerySegment)

/**
 * Internal decoded form of QueryPath
 */
const QueryPathDecoded = S.Array(QuerySegment)

/**
 * Query/Data paths - potentially deep paths that span multiple types through fields
 * These represent traversal paths through the schema graph
 *
 * Encoded: "User.posts.Post.author.User.name"
 * Decoded: [
 *   { _tag: 'TypeSegment', type: 'User' },
 *   { _tag: 'FieldSegment', field: 'posts' },
 *   { _tag: 'TypeSegment', type: 'Post' },
 *   { _tag: 'FieldSegment', field: 'author' },
 *   { _tag: 'TypeSegment', type: 'User' },
 *   { _tag: 'FieldSegment', field: 'name' }
 * ]
 *
 * Note: Assumes alternating type.field.type.field pattern
 */
export const QueryPath = S.transformOrFail(
  S.String,
  QueryPathDecoded,
  {
    decode: (str, _options, ast) => {
      if (!str) {
        return ParseResult.fail(new ParseResult.Type(ast, str))
      }

      const parts = str.split('.')
      const segments: QuerySegment[] = []

      // Assume alternating pattern: type.field.type.field...
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (!part) {
          return ParseResult.fail(new ParseResult.Type(ast, str))
        }

        if (i % 2 === 0) {
          // Even indices are types
          segments.push(TypeSegment.make({ type: part }))
        } else {
          // Odd indices are fields
          segments.push(FieldSegment.make({ field: part }))
        }
      }

      return ParseResult.succeed(segments)
    },
    encode: (path) => {
      const str = path.map(segment => {
        if (segment._tag === 'TypeSegment') return segment.type
        if (segment._tag === 'FieldSegment') return segment.field
        return ''
      }).filter(Boolean).join('.')

      return ParseResult.succeed(str)
    },
  },
).annotations({
  identifier: 'QueryPath',
  description: 'Query path through a GraphQL schema',
})

export type QueryPath = S.Schema.Type<typeof QueryPath>
