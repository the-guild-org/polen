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
 * Definition paths - direct paths to schema definition elements
 * These represent the "address" of a specific schema element
 */
export type DefinitionPath =
  | TypeDefinitionPath
  | FieldDefinitionPath
  | ArgumentDefinitionPath

/**
 * Path to a type definition
 * @example [{ kind: 'type', type: 'User' }]
 */
export type TypeDefinitionPath = [TypeSegment]

/**
 * Path to a field definition (type + field)
 * @example [{ kind: 'type', type: 'User' }, { kind: 'field', field: 'name' }]
 */
export type FieldDefinitionPath = [TypeSegment, FieldSegment]

/**
 * Path to an argument definition (type + field + argument)
 * @example [{ kind: 'type', type: 'User' }, { kind: 'field', field: 'posts' }, { kind: 'argument', argument: 'limit' }]
 */
export type ArgumentDefinitionPath = [TypeSegment, FieldSegment, ArgumentSegment]

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
