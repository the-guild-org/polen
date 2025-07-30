/**
 * UniversalHydratableLocator (UHL) - A URL-like identifier system for hydratables
 *
 * UHL provides a way to uniquely identify and locate hydratables within the Bridge system.
 * Like URLs identify resources on the web, UHLs identify hydratables in our data graph.
 *
 * @module
 */

import { S } from '#lib/kit-temp/effect'
import * as Segment from './segment.js'

/**
 * UniversalHydratableLocator - an array of segments forming a path to a hydratable
 *
 * @example
 * // Simple case - single segment
 * [{ tag: "Foo", uniqueKeys: {} }]
 *
 * @example
 * // With uniqueKeys
 * [{ tag: "SchemaVersioned", adt: "Schema", uniqueKeys: { version: "1.0.0" } }]
 *
 * @example
 * // With context - multiple segments
 * [
 *   { tag: "SchemaVersioned", adt: "Schema", uniqueKeys: { version: "1.0.0" } },
 *   { tag: "RevisionInitial", adt: "Revision", uniqueKeys: { date: "2024-01-15" } }
 * ]
 */
export const Uhl = S.Array(Segment.Segment).annotations({
  identifier: 'UHL',
  description: 'UniversalHydratableLocator - a path to a hydratable',
})
export type Uhl = S.Schema.Type<typeof Uhl>

// ============================================================================
// String Format Constants
// ============================================================================

export const SEGMENT_SEPARATOR = '___' as const

// Import segment-specific constants
export { ADT_SEPARATOR, KEY_VALUE_SEPARATOR, PROPERTY_SEPARATOR } from './segment.js'

// ============================================================================
// Constructors
// ============================================================================

export const decode = S.decode(Uhl)
export const encode = S.encode(Uhl)

// Segment constructor is available via the Segment namespace in $$.ts

/**
 * Create a UHL from segments
 */
export const make = (...segments: Segment.Segment[]): Uhl => segments

// ============================================================================
// Parsing and Serialization
// ============================================================================

/**
 * Convert UHL to string format (for index keys and file names)
 *
 * @example
 * toString([{ tag: "Foo", properties: [] }]) // "Foo"
 * toString([
 *   { tag: "SchemaVersioned", adt: "Schema", properties: [{ key: "version", value: "1.0.0" }] },
 *   { tag: "RevisionInitial", adt: "Revision", properties: [{ key: "date", value: "2024-01-15" }] }
 * ]) // "Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15"
 */
export const toString = (uhl: Uhl): string => {
  return uhl.map(Segment.toString).join(SEGMENT_SEPARATOR)
}

/**
 * Convert UHL to a JSON filename (alias for toFilePath)
 * @example
 * // [{ tag: 'Schema', adt: 'SchemaVersioned', uniqueKeys: { version: '1.0.0' } }]
 * // -> "Schema@SchemaVersioned_version@1.0.0.json"
 */
export const toFileName = (uhl: Uhl): string => {
  return `${toString(uhl)}.json`
}

/**
 * Parse a filename (with .json extension) back to UHL
 * @example
 * // "Schema@SchemaVersioned_version@1.0.0.json"
 * // -> [{ tag: 'Schema', adt: 'SchemaVersioned', uniqueKeys: { version: '1.0.0' } }]
 */
export const fromFileName = (fileName: string): Uhl => {
  // Remove .json extension if present
  const withoutExt = fileName.endsWith('.json') ? fileName.slice(0, -5) : fileName
  return fromString(withoutExt)
}

/**
 * Parse string format back to UHL
 *
 * @example
 * fromString("Foo") // [{ tag: "Foo", properties: [] }]
 * fromString("Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15")
 * // Returns the parsed UHL structure
 */
export const fromString = (str: string): Uhl => {
  if (!str) return []

  const segments = str.split(SEGMENT_SEPARATOR)
  return segments.map(Segment.fromString)
}

// ============================================================================
// Equivalence
// ============================================================================

// Segment equivalence is available via the Segment namespace in $$.ts

/**
 * Check if two UHLs are equivalent
 */
export const equivalent = S.equivalence(Uhl)
