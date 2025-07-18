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
 * // Create a query path
 * const queryPath = GraphQLPath.Query.builder()
 *   .type('User')
 *   .field('posts')
 *   .type('Post')
 *   .field('author')
 *   .type('User')
 *   .field('name')
 *   .build()
 *
 * // Encode/decode query paths
 * const encodedQuery = GraphQLPath.Query.encode(queryPath) // "User.posts.Post.author.User.name"
 * const decodedQuery = GraphQLPath.Query.decode("User.posts.Post.author") // query path
 * ```
 */

export * as Definition from './definition.js'
export * as Query from './query.js'
