import { S } from '#lib/kit-temp/effect'
import { Hydratable } from '../hydratable/$.js'

// ============================================================================
// Schema and Type
// ============================================================================

/**
 * A segment in the UHL path, representing one hydratable in the location hierarchy.
 *
 * This is the runtime counterpart to HydratableConfig:
 * - HydratableConfig defines WHICH keys make a hydratable unique (the schema)
 * - Segment contains the actual VALUES for those keys (the instance)
 *
 * The relationship:
 * - tag: identifies the hydratable type (same as the Effect Schema tag)
 * - adt: if present, indicates this is part of an ADT union (matches HydratableConfigAdt.name)
 * - uniqueKeys: actual values for the keys defined in HydratableConfig
 */
export const Segment = S.Struct({
  tag: S.String,
  adt: S.optional(S.String),
  uniqueKeys: S.optionalWith(Hydratable.UniqueKeys, { default: () => ({}) }),
}).annotations({
  identifier: 'UHL.Segment',
  description: 'A segment in the UHL path - instance data for a hydratable',
})

export type Segment = S.Schema.Type<typeof Segment>

// ============================================================================
// String Format Constants
// ============================================================================

export const ADT_SEPARATOR = '@' as const
export const PROPERTY_SEPARATOR = '!' as const
export const KEY_VALUE_SEPARATOR = '@' as const

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that a segment matches a HydratableConfig.
 * Ensures the segment has values for all required unique keys.
 */
export const validateAgainstConfig = (
  segment: Segment,
  config: Hydratable.Config,
  tag: string,
): boolean => {
  // Check tag matches
  if (segment.tag !== tag) return false

  // Check ADT matches
  if (config._tag === 'HydratableConfigAdt') {
    if (segment.adt !== config.name) return false
    const requiredKeys = config.memberKeys[tag] ?? []
    const segmentKeys = Object.keys(segment.uniqueKeys)
    return requiredKeys.every(key => segmentKeys.includes(key))
  } else {
    // Struct config
    if (segment.adt !== undefined) return false
    const segmentKeys = Object.keys(segment.uniqueKeys)
    return config.uniqueKeys.every(key => segmentKeys.includes(key))
  }
}

// ============================================================================
// Constructors
// ============================================================================

export const make = Segment.make

// ============================================================================
// Serialization
// ============================================================================

/**
 * Convert a single segment to its string representation
 *
 * @example
 * toString({ tag: "Foo", uniqueKeys: {} }) // "Foo"
 * toString({ tag: "SchemaVersioned", adt: "Schema", uniqueKeys: { version: "1.0.0" } })
 * // "Schema@SchemaVersioned!version@1.0.0"
 */
export const toString = (segment: Segment): string => {
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
 * Parse a segment string back to a Segment
 */
export const fromString = (str: string): Segment => {
  const parts = str.split(PROPERTY_SEPARATOR)
  const [identifier, ...propertyParts] = parts

  if (!identifier) {
    throw new Error(`Invalid segment: ${str}`)
  }

  // Parse identifier (could be "Type" or "ADT@Type")
  const [first, second] = identifier.split(ADT_SEPARATOR)
  const isADT = second !== undefined
  const tag = (isADT ? second : first)!
  const adt = isADT ? first : undefined

  // Parse uniqueKeys
  const uniqueKeys: Hydratable.UniqueKeysMutable = {}

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

  return make({
    tag,
    ...(adt && { adt }),
    uniqueKeys,
  })
}

// ============================================================================
// Equivalence
// ============================================================================

/**
 * Check if two segments are equivalent
 */
export const equivalent = S.equivalence(Segment)
