/**
 * Definition path operations
 */

import {
  createArgumentDefinitionPath,
  createFieldDefinitionPath,
  createTypeDefinitionPath,
  isArgumentDefinitionPath,
  isFieldDefinitionPath,
  isTypeDefinitionPath,
} from './constructors.js'
import type { ArgumentDefinitionPath, DefinitionPath, FieldDefinitionPath, TypeDefinitionPath } from './types.js'

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
