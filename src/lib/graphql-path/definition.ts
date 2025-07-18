/**
 * Definition path operations
 */

import { createArgumentSegment, createFieldSegment, createTypeSegment } from './constructors.js'

import type { ArgumentSegment, FieldSegment, TypeSegment } from '#lib/graphql-path/types'

/**
 * Encode a definition path to a human-readable expression string
 *
 * @param path - The definition path to encode
 * @returns A string expression representation
 * @example
 * encode(field('User', 'name')) // 'User.name'
 * encode(argument('User', 'posts', 'limit')) // 'User.posts(limit)'
 */
export const encode = (path: DefinitionPath): string => {
  if (isTypeDefinitionPath(path)) {
    return path[0].type
  } else if (isFieldDefinitionPath(path)) {
    return `${path[0].type}.${path[1].field}`
  } else if (isArgumentDefinitionPath(path)) {
    return `${path[0].type}.${path[1].field}(${path[2].argument})`
  }
  return ''
}

/**
 * Decode a string expression into a definition path
 *
 * @param expression - The string expression to decode
 * @returns The decoded definition path or null if invalid
 * @example
 * decode('User') // type definition path
 * decode('User.name') // field definition path
 * decode('User.posts(limit)') // argument definition path
 */
export const decode = (expression: string): DefinitionPath | null => {
  // Handle argument path: Type.field(argument)
  const argMatch = expression.match(/^([^.]+)\.([^.(]+)\(([^)]+)\)$/)
  if (argMatch) {
    const [, typeName, fieldName, argName] = argMatch
    if (!typeName || !fieldName || !argName) return null
    return createArgumentDefinitionPath(typeName, fieldName, argName)
  }

  // Handle field path: Type.field
  const fieldMatch = expression.match(/^([^.]+)\.([^.]+)$/)
  if (fieldMatch) {
    const [, typeName, fieldName] = fieldMatch
    if (!typeName || !fieldName) return null
    return createFieldDefinitionPath(typeName, fieldName)
  }

  // Handle type path: Type
  const typeMatch = expression.match(/^[^.]+$/)
  if (typeMatch) {
    return createTypeDefinitionPath(expression)
  }

  return null
}

/**
 * Extract the type name from any definition path
 *
 * @param path - The definition path
 * @returns The type name
 * @example getType([{ kind: 'type', type: 'User' }]) // 'User'
 */
export const getType = (path: DefinitionPath): string => {
  return path[0].type
}

/**
 * Extract the field name from a field or argument definition path
 *
 * @param path - The field or argument definition path
 * @returns The field name
 * @example getField([{ kind: 'type', type: 'User' }, { kind: 'field', field: 'name' }]) // 'name'
 */
export const getField = (path: FieldDefinitionPath | ArgumentDefinitionPath): string => {
  return path[1].field
}

/**
 * Extract the argument name from an argument definition path
 *
 * @param path - The argument definition path
 * @returns The argument name
 * @example getArgument([{ kind: 'type', type: 'User' }, { kind: 'field', field: 'posts' }, { kind: 'argument', argument: 'limit' }]) // 'limit'
 */
export const getArgument = (path: ArgumentDefinitionPath): string => {
  return path[2].argument
}

/**
 * Parse field path like "User.email" into type and field names
 */
export const parseFieldPath = (path?: string): { typeName: string | null; fieldName: string | null } => {
  if (!path) return { typeName: null, fieldName: null }

  const parts = path.split('.')
  if (parts.length >= 2) {
    return {
      typeName: parts[0] || null,
      fieldName: parts[1] || null,
    }
  }

  return { typeName: null, fieldName: null }
}

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
 * Type guard to check if a path is a type definition path
 *
 * @param path - The path to check
 * @returns True if the path is a type definition path
 */
export const isTypeDefinitionPath = (path: DefinitionPath): path is TypeDefinitionPath => {
  return path.length === 1 && path[0].kind === 'type'
}

/**
 * Type guard to check if a path is a field definition path
 *
 * @param path - The path to check
 * @returns True if the path is a field definition path
 */
export const isFieldDefinitionPath = (path: DefinitionPath): path is FieldDefinitionPath => {
  return path.length === 2 && path[0].kind === 'type' && path[1].kind === 'field'
}

/**
 * Type guard to check if a path is an argument definition path
 *
 * @param path - The path to check
 * @returns True if the path is an argument definition path
 */
export const isArgumentDefinitionPath = (path: DefinitionPath): path is ArgumentDefinitionPath => {
  return path.length === 3 && path[0].kind === 'type' && path[1].kind === 'field' && path[2].kind === 'argument'
}

/**
 * Create a path to a type definition
 *
 * @param type - The type name
 * @returns A type definition path
 * @example createTypeDefinitionPath('User') // [{ kind: 'type', type: 'User' }]
 */
export const createTypeDefinitionPath = (type: string): TypeDefinitionPath => {
  return [createTypeSegment(type)]
}

/**
 * Create a path to a field definition
 *
 * @param type - The type name
 * @param field - The field name
 * @returns A field definition path
 * @example createFieldDefinitionPath('User', 'name') // [{ kind: 'type', type: 'User' }, { kind: 'field', field: 'name' }]
 */
export const createFieldDefinitionPath = (type: string, field: string): FieldDefinitionPath => {
  return [createTypeSegment(type), createFieldSegment(field)]
}

/**
 * Create a path to an argument definition
 *
 * @param type - The type name
 * @param field - The field name
 * @param argument - The argument name
 * @returns An argument definition path
 * @example createArgumentDefinitionPath('User', 'posts', 'limit') // [{ kind: 'type', type: 'User' }, { kind: 'field', field: 'posts' }, { kind: 'argument', argument: 'limit' }]
 */
export const createArgumentDefinitionPath = (
  type: string,
  field: string,
  argument: string,
): ArgumentDefinitionPath => {
  return [createTypeSegment(type), createFieldSegment(field), createArgumentSegment(argument)]
}

/**
 * Create a type definition path
 *
 * @param type - The type name
 * @returns A type definition path
 * @example type('User') // [{ kind: 'type', type: 'User' }]
 */
export const type = createTypeDefinitionPath

/**
 * Create a field definition path
 *
 * @param type - The type name
 * @param field - The field name
 * @returns A field definition path
 * @example field('User', 'name') // [{ kind: 'type', type: 'User' }, { kind: 'field', field: 'name' }]
 */
export const field = createFieldDefinitionPath

/**
 * Create an argument definition path
 *
 * @param type - The type name
 * @param field - The field name
 * @param argument - The argument name
 * @returns An argument definition path
 * @example argument('User', 'posts', 'limit') // [{ kind: 'type', type: 'User' }, { kind: 'field', field: 'posts' }, { kind: 'argument', argument: 'limit' }]
 */
export const argument = createArgumentDefinitionPath
