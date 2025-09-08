/**
 * Definition path operations using Effect Schema transforms
 */

import { S } from '#lib/kit-temp/effect'
import { ParseResult } from 'effect'
import { ArgumentSegment, FieldSegment, TypeSegment } from './types.js'

// ============================================================================
// Internal Path Schemas (Decoded Forms)
// ============================================================================

const TypeDefinitionPathDecoded = S.Tuple(TypeSegment)
const FieldDefinitionPathDecoded = S.Tuple(TypeSegment, FieldSegment)
const ArgumentDefinitionPathDecoded = S.Tuple(TypeSegment, FieldSegment, ArgumentSegment)

// ============================================================================
// Transform Codecs (String <-> Struct)
// ============================================================================

/**
 * Type definition path codec
 * Encoded: "User"
 * Decoded: [{ _tag: 'TypeSegment', type: 'User' }]
 */
export const TypeDefinitionPath = S.transformOrFail(
  S.String,
  TypeDefinitionPathDecoded,
  {
    decode: (str, _options, ast) => {
      if (!str || str.includes('.') || str.includes('(')) {
        return ParseResult.fail(new ParseResult.Type(ast, str))
      }
      return ParseResult.succeed([TypeSegment.make({ type: str })])
    },
    encode: (path) => ParseResult.succeed(path[0].type),
  },
).annotations({
  identifier: 'TypeDefinitionPath',
  description: 'Path to a type definition',
})

/**
 * Field definition path codec
 * Encoded: "User.name"
 * Decoded: [{ _tag: 'TypeSegment', type: 'User' }, { _tag: 'FieldSegment', field: 'name' }]
 */
export const FieldDefinitionPath = S.transformOrFail(
  S.String,
  FieldDefinitionPathDecoded,
  {
    decode: (str, _options, ast) => {
      const parts = str.split('.')
      if (parts.length !== 2 || !parts[0] || !parts[1] || str.includes('(')) {
        return ParseResult.fail(new ParseResult.Type(ast, str))
      }
      return ParseResult.succeed([
        TypeSegment.make({ type: parts[0] }),
        FieldSegment.make({ field: parts[1] }),
      ])
    },
    encode: (path) => ParseResult.succeed(`${path[0].type}.${path[1].field}`),
  },
).annotations({
  identifier: 'FieldDefinitionPath',
  description: 'Path to a field definition',
})

/**
 * Argument definition path codec
 * Encoded: "User.posts(limit)"
 * Decoded: [{ _tag: 'TypeSegment', type: 'User' }, { _tag: 'FieldSegment', field: 'posts' }, { _tag: 'ArgumentSegment', argument: 'limit' }]
 */
export const ArgumentDefinitionPath = S.transformOrFail(
  S.String,
  ArgumentDefinitionPathDecoded,
  {
    decode: (str, _options, ast) => {
      const match = str.match(/^([^.]+)\.([^.(]+)\(([^)]+)\)$/)
      if (!match || !match[1] || !match[2] || !match[3]) {
        return ParseResult.fail(new ParseResult.Type(ast, str))
      }
      return ParseResult.succeed([
        TypeSegment.make({ type: match[1] }),
        FieldSegment.make({ field: match[2] }),
        ArgumentSegment.make({ argument: match[3] }),
      ])
    },
    encode: (path) => ParseResult.succeed(`${path[0].type}.${path[1].field}(${path[2].argument})`),
  },
).annotations({
  identifier: 'ArgumentDefinitionPath',
  description: 'Path to an argument definition',
})

/**
 * Union of all definition paths
 * Automatically determines the correct path type from the string format
 */
export const DefinitionPath = S.Union(
  ArgumentDefinitionPath, // Check argument first (most specific)
  FieldDefinitionPath, // Then field
  TypeDefinitionPath, // Then type (least specific)
).annotations({
  identifier: 'DefinitionPath',
  description: 'Union of all definition path types',
})

// ============================================================================
// Type Exports
// ============================================================================

export type TypeDefinitionPath = S.Schema.Type<typeof TypeDefinitionPath>
export type FieldDefinitionPath = S.Schema.Type<typeof FieldDefinitionPath>
export type ArgumentDefinitionPath = S.Schema.Type<typeof ArgumentDefinitionPath>
export type DefinitionPath = S.Schema.Type<typeof DefinitionPath>

// ============================================================================
// Codec Functions
// ============================================================================

/**
 * Decode a string expression into a definition path
 * @param expression - The string expression to decode
 * @returns The decoded definition path
 * @example
 * decode('User') // type definition path
 * decode('User.name') // field definition path
 * decode('User.posts(limit)') // argument definition path
 */
export const decode = S.decodeUnknownSync(DefinitionPath)

/**
 * Encode a definition path to a string expression
 * @param path - The definition path to encode
 * @returns A string expression representation
 * @example
 * encode([{ _tag: 'TypeSegment', type: 'User' }]) // 'User'
 * encode([{ _tag: 'TypeSegment', type: 'User' }, { _tag: 'FieldSegment', field: 'name' }]) // 'User.name'
 */
export const encode = S.encodeSync(DefinitionPath)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract the type name from any definition path
 * @param path - The definition path
 * @returns The type name
 */
export const getType = (path: DefinitionPath): string => {
  return path[0].type
}

/**
 * Extract the field name from a field or argument definition path
 * @param path - The field or argument definition path
 * @returns The field name
 */
export const getField = (path: FieldDefinitionPath | ArgumentDefinitionPath): string => {
  return path[1].field
}

/**
 * Extract the argument name from an argument definition path
 * @param path - The argument definition path
 * @returns The argument name
 */
export const getArgument = (path: ArgumentDefinitionPath): string => {
  return path[2].argument
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a path is a type definition path
 */
export const isTypeDefinitionPath = (path: DefinitionPath): path is TypeDefinitionPath => {
  return path.length === 1 && path[0]._tag === 'TypeSegment'
}

/**
 * Type guard to check if a path is a field definition path
 */
export const isFieldDefinitionPath = (path: DefinitionPath): path is FieldDefinitionPath => {
  return path.length === 2 && path[0]._tag === 'TypeSegment' && path[1]._tag === 'FieldSegment'
}

/**
 * Type guard to check if a path is an argument definition path
 */
export const isArgumentDefinitionPath = (path: DefinitionPath): path is ArgumentDefinitionPath => {
  return (
    path.length === 3
    && path[0]._tag === 'TypeSegment'
    && path[1]._tag === 'FieldSegment'
    && path[2]._tag === 'ArgumentSegment'
  )
}

// ============================================================================
// Constructor Functions
// ============================================================================

/**
 * Create a type definition path
 * @param type - The type name
 * @returns A type definition path
 */
export const type = (typeName: string): TypeDefinitionPath => {
  return [TypeSegment.make({ type: typeName })]
}

/**
 * Create a field definition path
 * @param type - The type name
 * @param field - The field name
 * @returns A field definition path
 */
export const field = (typeName: string, fieldName: string): FieldDefinitionPath => {
  return [TypeSegment.make({ type: typeName }), FieldSegment.make({ field: fieldName })]
}

/**
 * Create an argument definition path
 * @param type - The type name
 * @param field - The field name
 * @param argument - The argument name
 * @returns An argument definition path
 */
export const argument = (typeName: string, fieldName: string, argumentName: string): ArgumentDefinitionPath => {
  return [
    TypeSegment.make({ type: typeName }),
    FieldSegment.make({ field: fieldName }),
    ArgumentSegment.make({ argument: argumentName }),
  ]
}
