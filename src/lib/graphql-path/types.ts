/**
 * GraphQL Path type definitions
 */

/**
 * Base segment representing a GraphQL type in a path
 */
export interface TypeSegment {
  kind: 'type'
  type: string
}

/**
 * Base segment representing a field in a path
 */
export interface FieldSegment {
  kind: 'field'
  field: string
}

/**
 * Base segment representing an argument in a path
 */
export interface ArgumentSegment {
  kind: 'argument'
  argument: string
}

/**
 * Union of all possible segments
 */
export type Segment = TypeSegment | FieldSegment | ArgumentSegment

/**
 * Query segments - only types and fields can be traversed in queries
 * Arguments cannot be part of query paths as they are not traversable
 */
export type QuerySegment = TypeSegment | FieldSegment

/**
 * Query/Data paths - potentially deep paths that span multiple types through fields
 * These represent traversal paths through the schema graph
 *
 * @example
 * User.posts.author.name would be:
 * [
 *   { kind: 'type', type: 'User' },
 *   { kind: 'field', field: 'posts' },
 *   { kind: 'type', type: 'Post' },
 *   { kind: 'field', field: 'author' },
 *   { kind: 'type', type: 'User' },
 *   { kind: 'field', field: 'name' }
 * ]
 */
export type QueryPath = QuerySegment[]
