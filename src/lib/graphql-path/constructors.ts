/**
 * Constructor functions and type guards
 */

import type {
  ArgumentDefinitionPath,
  ArgumentSegment,
  DefinitionPath,
  FieldDefinitionPath,
  FieldSegment,
  QuerySegment,
  Segment,
  TypeDefinitionPath,
  TypeSegment,
} from './types.js'

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
 * Type guard to check if a segment is a type segment
 *
 * @param segment - The segment to check
 * @returns True if the segment is a type segment
 */
export const isTypeSegment = (segment: Segment): segment is TypeSegment => {
  return segment.kind === 'type'
}

/**
 * Type guard to check if a segment is a field segment
 *
 * @param segment - The segment to check
 * @returns True if the segment is a field segment
 */
export const isFieldSegment = (segment: Segment): segment is FieldSegment => {
  return segment.kind === 'field'
}

/**
 * Type guard to check if a segment is an argument segment
 *
 * @param segment - The segment to check
 * @returns True if the segment is an argument segment
 */
export const isArgumentSegment = (segment: Segment): segment is ArgumentSegment => {
  return segment.kind === 'argument'
}

/**
 * Type guard to check if a segment can be used in a query path
 *
 * @param segment - The segment to check
 * @returns True if the segment can be used in a query path
 */
export const isQuerySegment = (segment: Segment): segment is QuerySegment => {
  return segment.kind === 'type' || segment.kind === 'field'
}

/**
 * Create a type segment
 *
 * @param type - The type name
 * @returns A type segment
 * @example createTypeSegment('User') // { kind: 'type', type: 'User' }
 */
export const createTypeSegment = (type: string): TypeSegment => ({
  kind: 'type',
  type,
})

/**
 * Create a field segment
 *
 * @param field - The field name
 * @returns A field segment
 * @example createFieldSegment('name') // { kind: 'field', field: 'name' }
 */
export const createFieldSegment = (field: string): FieldSegment => ({
  kind: 'field',
  field,
})

/**
 * Create an argument segment
 *
 * @param argument - The argument name
 * @returns An argument segment
 * @example createArgumentSegment('limit') // { kind: 'argument', argument: 'limit' }
 */
export const createArgumentSegment = (argument: string): ArgumentSegment => ({
  kind: 'argument',
  argument,
})

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
