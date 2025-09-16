import { S } from '#lib/kit-temp'

/**
 * GraphQL name validation schema.
 *
 * Validates that a string conforms to GraphQL naming rules:
 * - Must start with a letter or underscore
 * - Can contain letters, digits, and underscores
 * - Cannot start with "__" (reserved for introspection)
 */

// ============================================================================
// Schema
// ============================================================================

/**
 * Valid GraphQL name.
 * Follows GraphQL spec naming rules.
 * Allows introspection fields (__typename, __type, __schema).
 */
const introspectionFields = new Set(['__typename', '__type', '__schema'])

export const GraphQLName = S.String.pipe(
  S.pattern(/^[_a-zA-Z][_a-zA-Z0-9]*$/),
  S.filter(
    (name) => !name.startsWith('__') || introspectionFields.has(name),
    {
      message: () => 'GraphQL names cannot start with "__" (except for introspection fields)',
    },
  ),
)

export type GraphQLName = S.Schema.Type<typeof GraphQLName>
export type GraphQLNameEncoded = S.Schema.Encoded<typeof GraphQLName>

// ============================================================================
// Constructors
// ============================================================================

export const make = GraphQLName.make

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decodeUnknown(GraphQLName)
export const decodeSync = S.decodeUnknownSync(GraphQLName)
export const encode = S.encode(GraphQLName)
export const encodeSync = S.encodeSync(GraphQLName)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(GraphQLName)

// ============================================================================
// Type-level Utilities
// ============================================================================

export type GraphQLNameStart =
  | '_'
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'
