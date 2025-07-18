/**
 * Constructor functions and type guards
 */

import type { ArgumentSegment, FieldSegment, QuerySegment, Segment, TypeSegment } from './types.js'

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
