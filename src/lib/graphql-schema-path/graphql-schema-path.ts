import { S } from '#lib/kit-temp/effect'
import { Effect, ParseResult } from 'effect'
import { Nodes } from './nodes/$.js'
import { parse as parseTokens } from './parser/parser.js'
import { tokenize } from './parser/tokenizer.js'
import type { ParsePath } from './parser/type-parser.js'

/**
 * The root GraphQL schema path structure with bidirectional string codec.
 * Represents a complete path to any element in a GraphQL schema.
 *
 * @property version - Optional version coverage for multi-version schema support
 * @property value - The starting point of the path (output or input type)
 *
 * String format examples:
 * - "User" - The User type
 * - "User.posts" - Field access
 * - "User.posts$limit" - Argument access
 * - "User@deprecated" - Directive
 * - "v1.0:User" - With version
 * - "v1.0,2.0:User.posts" - Multiple versions
 * - "v1.0-3.0:Query.users" - Version range
 *
 * AST format examples:
 * ```typescript
 * // Simple type reference
 * { _tag: 'GraphQLSchemaPath', value: { _tag: 'GraphQLPathSegmentOutputType', name: 'User' } }
 *
 * // Field path
 * { _tag: 'GraphQLSchemaPath', value: {
 *   _tag: 'GraphQLPathSegmentOutputType',
 *   name: 'User',
 *   next: { _tag: 'GraphQLPathSegmentOutputField', name: 'posts' }
 * }}
 *
 * // With version coverage
 * { _tag: 'GraphQLSchemaPath',
 *   version: '1.0-2.0',
 *   value: { _tag: 'GraphQLPathSegmentOutputType', name: 'User' }
 * }
 * ```
 *
 * @todo Consider adding GraphQLPathSegmentDirectiveDefinition for standalone directive definitions
 * e.g., "directive @deprecated(reason: String) on FIELD_DEFINITION"
 * Currently we only support directive applications (directives on types/fields)
 */

// ============================================================================
// Parser Functions
// ============================================================================

export const parse = (input: string): Nodes.Root.Root => {
  const tokens = tokenize(input)
  return parseTokens(tokens)
}

export const print = (path: Nodes.Root.Root): string => {
  let result = ''

  // Add version if present
  if (path.version) {
    result += `${path.version}:`
  }

  // Print the path segments
  let current: any = path.next
  let isFirst = true

  while (current) {
    if (!isFirst) {
      // Add appropriate separator based on segment type
      if (
        current._tag === 'GraphQLPathSegmentField' || current._tag === 'GraphQLPathSegmentOutputField'
        || current._tag === 'GraphQLPathSegmentInputField'
      ) {
        result += '.'
      } else if (current._tag === 'GraphQLPathSegmentArgument') {
        result += '$'
      } else if (current._tag === 'GraphQLPathSegmentDirective') {
        result += '@'
      } else if (current._tag === 'GraphQLPathSegmentResolvedType') {
        result += '#'
      }
    }

    result += current.name
    isFirst = false
    current = current.next
  }

  return result
}

// ============================================================================
// Schema Definition
// ============================================================================

export const Path = S.transformOrFail(
  S.String,
  Nodes.Root.Schema,
  {
    strict: true,
    decode: (input) =>
      ParseResult.try({
        try: () => parse(input),
        catch: (error) =>
          new ParseResult.Type(
            S.String.ast,
            input,
            error instanceof Error ? error.message : String(error),
          ),
      }),
    encode: (path) => ParseResult.succeed(print(path)),
  },
)

export type Path = S.Schema.Type<typeof Nodes.Root.Schema>

// ============================================================================
// Decoders
// ============================================================================

/**
 * Decode a string into a GraphQL schema path with type-level parsing
 * When used with string literals, returns the exact parsed type
 *
 * @example
 * const path = await Effect.runPromise(decode('User.posts'))
 * // Type is exactly: ParsePath<'User.posts'>
 */
export function decode<$Input extends string>(
  input: $Input,
): Effect.Effect<
  ParsePath<$Input> extends { _tag: 'GraphQLPathRoot' } ? ParsePath<$Input>
    : Path,
  ParseResult.ParseError,
  never
> {
  return S.decodeUnknown(Path as any)(input) as any
}

/**
 * Synchronously decode a string into a GraphQL schema path with type-level parsing
 * When used with string literals, returns the exact parsed type
 *
 * @example
 * const path = decodeSync('User.posts')
 * // Type is exactly: ParsePath<'User.posts'>
 */
export function decodeSync<$Input extends string>(
  input: $Input,
): ParsePath<$Input> extends { _tag: 'GraphQLPathRoot' } ? ParsePath<$Input>
  : Path
{
  return S.decodeUnknownSync(Path as any)(input) as any
}

export const encode = S.encode(Path as any)
export const encodeSync = S.encodeSync(Path as any)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Path)
