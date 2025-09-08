/**
 * Query path operations
 */

import { S } from '#lib/kit-temp/effect'
import { QueryPath } from './types.js'

/**
 * Encode a query path to a human-readable expression string
 * Uses the Effect Schema codec for QueryPath
 *
 * @param path - The query path segments to encode
 * @returns A string expression representation
 * @example
 * encode([
 *   { _tag: 'TypeSegment', type: 'User' },
 *   { _tag: 'FieldSegment', field: 'posts' },
 *   { _tag: 'TypeSegment', type: 'Post' },
 *   { _tag: 'FieldSegment', field: 'title' }
 * ]) // 'User.posts.Post.title'
 */
export const encode = S.encodeSync(QueryPath)

/**
 * Decode a string expression into a query path
 * Uses the Effect Schema codec for QueryPath
 * Note: This assumes alternating type.field.type.field pattern
 *
 * @param expression - The string expression to decode
 * @returns The decoded query path segments
 * @throws ParseError if the expression is invalid
 * @example
 * decode('User.posts.Post.title') // Query path traversing User->posts->Post->title
 */
export const decode = S.decodeUnknownSync(QueryPath)
