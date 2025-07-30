/**
 * UniversalHydratableLocator (UHL) - A URL-like identifier system for hydratables
 *
 * UHL provides a way to uniquely identify and locate hydratables within the Bridge system.
 * Like URLs identify resources on the web, UHLs identify hydratables in our data graph.
 *
 * @module
 */

import { S } from '#lib/kit-temp/effect'
import { Brand, Equal } from 'effect'

// ============================================================================
// Branded Types
// ============================================================================

/**
 * Tag name identifying a hydratable type (e.g., "SchemaVersioned", "Revision")
 */
export type Tag = string & Brand.Brand<'UHL.Tag'>
export const Tag = S.String.pipe(
  S.brand('UHL.Tag'),
  S.annotations({
    identifier: 'UHL.Tag',
    description: 'A tag identifying a hydratable type',
  }),
)

// ============================================================================
// Schema and Type
// ============================================================================

/**
 * A segment in the UHL path, representing one hydratable in the location hierarchy
 */
export const Segment = S.Struct({
  tag: Tag,
  adt: S.optional(S.String),
  uniqueKeys: S.Record({ key: S.String, value: S.Union(S.String, S.Number) }),
}).annotations({
  identifier: 'UHL.Segment',
  description: 'A segment in the UHL path',
})
export type Segment = S.Schema.Type<typeof Segment>

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
export const UHL = S.Array(Segment).annotations({
  identifier: 'UHL',
  description: 'UniversalHydratableLocator - a path to a hydratable',
})
export type UHL = S.Schema.Type<typeof UHL>

// ============================================================================
// String Format Constants
// ============================================================================

export const SEGMENT_SEPARATOR = '___' as const
export const ADT_SEPARATOR = '@' as const
export const PROPERTY_SEPARATOR = '!' as const
export const KEY_VALUE_SEPARATOR = '@' as const

// All reserved characters that cannot appear in values
export const RESERVED_CHARS = [SEGMENT_SEPARATOR, ADT_SEPARATOR, PROPERTY_SEPARATOR] as const

// ============================================================================
// Segment Template
// ============================================================================

/**
 * Template for creating UHL segments - contains structure but no runtime values
 * Used in tree structures to define what segments should look like
 */
export interface SegmentTemplate {
  tag: string
  adt?: string
  uniqueKeys: string[]
}

/**
 * Creates a segment template
 */
export const makeSegmentTemplate = (
  tag: string,
  uniqueKeys: string[],
  adt?: string,
): SegmentTemplate => {
  const template: SegmentTemplate = { tag, uniqueKeys }
  if (adt) template.adt = adt
  return template
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a value contains any reserved characters
 */
const containsReservedChars = (value: string): boolean => {
  return RESERVED_CHARS.some(char => value.includes(char))
}

/**
 * Validate that a value doesn't contain reserved characters
 */
const validateValue = (value: string, context: string): void => {
  if (containsReservedChars(value)) {
    throw new Error(
      `Reserved characters found in ${context}: "${value}". Reserved characters are: ${RESERVED_CHARS.join(', ')}`,
    )
  }
}

// ============================================================================
// Constructors
// ============================================================================

export const decode = S.decode(UHL)
export const decodeSync = S.decodeSync(UHL)
export const encode = S.encode(UHL)

/**
 * Create a single segment
 */
export const makeSegment = (
  tag: string,
  uniqueKeys: Readonly<Record<string, string | number>> = {},
  adt?: string,
): Segment => {
  // Validate tag
  validateValue(tag, 'tag')

  // Validate adt if present
  if (adt) {
    validateValue(adt, 'adt')
  }

  // Validate all unique key names and values
  for (const [key, value] of Object.entries(uniqueKeys)) {
    validateValue(key, `unique key name`)
    validateValue(String(value), `unique key value for "${key}"`)
  }

  return {
    tag: tag as Tag,
    ...(adt && { adt }),
    uniqueKeys,
  }
}

/**
 * Create a UHL from segments
 */
export const make = (...segments: Segment[]): UHL => segments

// ============================================================================
// Parsing and Serialization
// ============================================================================

/**
 * Convert a single segment to its string representation
 *
 * @example
 * segmentToString({ tag: "Foo", keys: {} }) // "Foo"
 * segmentToString({ tag: "SchemaVersioned", adt: "Schema", keys: { version: "1.0.0" } })
 * // "Schema@SchemaVersioned!version@1.0.0"
 */
const segmentToString = (segment: Segment): string => {
  let result = segment.tag as string

  // Handle ADT member format
  if (segment.adt) {
    result = `${segment.adt}${ADT_SEPARATOR}${result}`
  }

  // Add uniqueKeys
  const keyNames = Object.keys(segment.uniqueKeys)
  if (keyNames.length > 0) {
    const kvPairs = keyNames
      .sort() // Ensure consistent ordering
      .map(key => `${key}${KEY_VALUE_SEPARATOR}${segment.uniqueKeys[key]}`)
      .join(PROPERTY_SEPARATOR)
    result += PROPERTY_SEPARATOR + kvPairs
  }

  return result
}

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
export const toString = (uhl: UHL): string => {
  return uhl.map(segmentToString).join(SEGMENT_SEPARATOR)
}

/**
 * Convert UHL to file path
 */
export const toFilePath = (uhl: UHL): string => {
  return `${toString(uhl)}.json`
}

/**
 * Parse a segment string back to a Segment
 */
const parseSegment = (str: string): Segment => {
  const parts = str.split(PROPERTY_SEPARATOR)
  const [identifier, ...propertyParts] = parts

  if (!identifier) {
    throw new Error(`Invalid segment: ${str}`)
  }

  // Parse identifier (could be "Type" or "ADT@Type")
  const [first, second] = identifier.split(ADT_SEPARATOR)
  const isADT = second !== undefined
  const tag = (isADT ? second : first) as Tag
  const adt = isADT ? first : undefined

  // Parse uniqueKeys
  const uniqueKeys: Record<string, string | number> = {}

  for (const part of propertyParts) {
    const sepIndex = part.indexOf(KEY_VALUE_SEPARATOR)
    if (sepIndex === -1) {
      throw new Error(`Invalid property: ${part}`)
    }

    const key = part.slice(0, sepIndex)
    const value = part.slice(sepIndex + 1)

    if (!key || !value) {
      throw new Error(`Invalid property: ${part}`)
    }

    // Try to parse as number
    const numValue = Number(value)
    uniqueKeys[key] = !isNaN(numValue) && value === String(numValue) ? numValue : value
  }

  return {
    tag,
    ...(adt && { adt }),
    uniqueKeys,
  }
}

/**
 * Parse string format back to UHL
 *
 * @example
 * fromString("Foo") // [{ tag: "Foo", properties: [] }]
 * fromString("Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15")
 * // Returns the parsed UHL structure
 */
export const fromString = (str: string): UHL => {
  if (!str) return []

  const segments = str.split(SEGMENT_SEPARATOR)
  return segments.map(parseSegment)
}

// ============================================================================
// Equivalence
// ============================================================================

/**
 * Check if two UHL segments are equivalent
 */
export const segmentEquivalent = (a: Segment, b: Segment): boolean => {
  if (a.tag !== b.tag) return false
  if (a.adt !== b.adt) return false

  const aKeyNames = Object.keys(a.uniqueKeys)
  const bKeyNames = Object.keys(b.uniqueKeys)

  if (aKeyNames.length !== bKeyNames.length) return false

  // Check all uniqueKeys match
  for (const key of aKeyNames) {
    if (!Equal.equals(a.uniqueKeys[key], b.uniqueKeys[key])) return false
  }

  return true
}

/**
 * Check if two UHLs are equivalent
 */
export const equivalent = (a: UHL, b: UHL): boolean => {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (!segmentEquivalent(a[i]!, b[i]!)) return false
  }

  return true
}
