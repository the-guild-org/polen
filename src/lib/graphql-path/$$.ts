/**
 * GraphQL Path Library
 *
 * This library provides type-safe path representations for GraphQL schemas.
 * It distinguishes between definition paths (addresses to schema elements)
 * and query paths (traversal paths through the schema graph).
 *
 * @example
 * ```ts
 * import { GraphQLPath } from '#lib/graphql-path'
 *
 * // Create a path to a type definition
 * const userTypePath = GraphQLPath.Definition.type('User')
 *
 * // Create a path to a field definition
 * const userNameFieldPath = GraphQLPath.Definition.field('User', 'name')
 *
 * // Create a path to an argument definition
 * const userPostsLimitArgPath = GraphQLPath.Definition.argument('User', 'posts', 'limit')
 *
 * // Encode/decode definition paths
 * const encoded = GraphQLPath.Definition.encode(userNameFieldPath) // "User.name"
 * const decoded = GraphQLPath.Definition.decode("User.name") // field definition path
 *
 * // Decode a query path from a string
 * const queryPath = GraphQLPath.Query.decode("User.posts.Post.author.User.name")
 * // Returns array of segments: [TypeSegment, FieldSegment, TypeSegment, FieldSegment, ...]
 *
 * // Encode query path segments to a string
 * const encoded = GraphQLPath.Query.encode(queryPath) // "User.posts.Post.author.User.name"
 * ```
 */

export * as Definition from './definition.js'
export * as Query from './query.js'
export * as Schema from './schema.js'
