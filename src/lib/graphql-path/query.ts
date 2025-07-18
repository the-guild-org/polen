/**
 * Query path operations
 */

import { createFieldSegment, createTypeSegment } from './constructors.js'
import type { QueryPath, QuerySegment } from './types.js'

/**
 * Builder class for creating query paths with a fluent interface
 *
 * @example
 * ```ts
 * const path = builder()
 *   .type('User')
 *   .field('posts')
 *   .type('Post')
 *   .field('author')
 *   .build()
 * ```
 */
export class QueryPathBuilder {
  private segments: QuerySegment[] = []

  /**
   * Add a type segment to the path
   *
   * @param typeName - The type name
   * @returns The builder for chaining
   */
  type(typeName: string): this {
    this.segments.push(createTypeSegment(typeName))
    return this
  }

  /**
   * Add a field segment to the path
   *
   * @param fieldName - The field name
   * @returns The builder for chaining
   */
  field(fieldName: string): this {
    this.segments.push(createFieldSegment(fieldName))
    return this
  }

  /**
   * Build the final query path
   *
   * @returns The constructed query path
   */
  build(): QueryPath {
    return this.segments
  }
}

/**
 * Create a new query path builder
 *
 * @returns A new query path builder instance
 * @example
 * ```ts
 * const path = builder()
 *   .type('User')
 *   .field('posts')
 *   .type('Post')
 *   .field('author')
 *   .build()
 * ```
 */
export const builder = (): QueryPathBuilder => new QueryPathBuilder()

/**
 * Encode a query path to a human-readable expression string
 *
 * @param path - The query path to encode
 * @returns A string expression representation
 * @example
 * encode(builder().type('User').field('posts').type('Post').field('title').build()) // 'User.posts.Post.title'
 */
export const encode = (path: QueryPath): string => {
  return path.map(segment => {
    if (segment.kind === 'type') return segment.type
    if (segment.kind === 'field') return segment.field
    return ''
  }).filter(Boolean).join('.')
}

/**
 * Decode a string expression into a query path
 * Note: This assumes alternating type.field.type.field pattern
 *
 * @param expression - The string expression to decode
 * @returns The decoded query path or null if invalid
 * @example
 * decode('User.posts.Post.title') // Query path traversing User->posts->Post->title
 */
export const decode = (expression: string): QueryPath | null => {
  if (!expression) return null

  const parts = expression.split('.')
  const segments: QuerySegment[] = []

  // Assume alternating pattern: type.field.type.field...
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue

    if (i % 2 === 0) {
      // Even indices are types
      segments.push(createTypeSegment(part))
    } else {
      // Odd indices are fields
      segments.push(createFieldSegment(part))
    }
  }

  return segments
}
