// @claude use Hydratable NS
import { type UniqueKeys, type UniqueKeysMutable } from '../hydratable/hydratable.js'
import { Uhl } from '../uhl/$.js'
import type { Selection } from './input.js'

/**
 * Convert a Bridge selection DSL to UHL arrays
 *
 * Examples:
 * - { Foo: true } -> [[{ tag: 'Foo', uniqueKeys: {} }]]
 * - { User: { id: 'abc123' } } -> [[{ tag: 'User', uniqueKeys: { id: 'abc123' } }]]
 * - { CatalogVersioned: { version: '1.0.0' } } -> [[{ tag: 'CatalogVersioned', uniqueKeys: { version: '1.0.0' }, adt: 'Catalog' }]]
 * - { RevisionInitial: { date: '2025-12-14', $SchemaVersioned: { version: "123" } } }
 *   -> [[{ tag: 'SchemaVersioned', uniqueKeys: { version: '123' }, adt: 'Schema' },
 *        { tag: 'RevisionInitial', uniqueKeys: { date: '2025-12-14' }, adt: 'Revision' }]]
 */
export const toUHL = (selection: Selection): Uhl.Uhl[] => {
  if (Array.isArray(selection)) {
    return selection.flatMap(sel => toUHL(sel))
  }

  // Process each top-level key in the selection
  const results: Uhl.Uhl[] = []

  for (const [tag, value] of Object.entries(selection)) {
    const uhls = processSelectionEntry(tag, value, [])
    results.push(...uhls)
  }

  return results
}

/**
 * Parse a tag to detect ADT pattern
 * Simple implementation that matches the camelCase convention
 */
const parseADTTag = (tag: string): { adtName: string; memberName: string } | null => {
  // Match pattern: Capital + lowercase letters, then Capital + any letters
  const match = tag.match(/^([A-Z][a-z]+)([A-Z][a-zA-Z]+)$/)

  if (!match) {
    return null
  }

  const [, adtName, memberName] = match

  // Suffix must have at least one lowercase to be valid camelCase
  if (!adtName || !memberName || !/[a-z]/.test(memberName)) {
    return null
  }

  return { adtName, memberName }
}

/**
 * Process a single selection entry and convert to UHL
 */
const processSelectionEntry = (
  tag: string,
  value: true | Record<string, unknown> | string | number,
  context: Uhl.Uhl,
): Uhl.Uhl[] => {
  // Parse potential ADT info from tag
  const adtInfo = parseADTTag(tag)
  const adt = adtInfo?.adtName

  // Handle shallow selection
  if (value === true || (typeof value === 'object' && value !== null && Object.keys(value).length === 0)) {
    // Singleton or empty object selection
    return [[...context, Uhl.Segment.make({ tag: tag, uniqueKeys: {}, ...(adt && { adt }) })]]
  }

  // Handle single-key shorthand (e.g., { User: 'abc123' })
  if (typeof value === 'string' || typeof value === 'number') {
    // This is shorthand for a hydratable with a single unique key
    // We don't know the key name here, so this is invalid
    throw new Error(
      `Invalid selection value for ${tag}: single-key shorthand requires object form with explicit key name`,
    )
  }

  // Handle object selection
  if (typeof value === 'object' && value !== null) {
    const { uniqueKeys, contextUHLs, disambiguationPath } = extractKeysAndContext(
      value as Record<string, unknown>,
    )

    // If we have a disambiguation path, it provides the full context from root
    if (disambiguationPath) {
      // The disambiguation path already contains the full path from root
      // We just need to add our segment at the end
      return [[...disambiguationPath, Uhl.Segment.make({ tag: tag, uniqueKeys, ...(adt && { adt }) })]]
    }

    // If we have context, we need to prepend it to our segment
    if (contextUHLs.length > 0) {
      const results: Uhl.Uhl[] = []
      for (const contextUHL of contextUHLs) {
        const fullContext = [...context, ...contextUHL]
        results.push([...fullContext, Uhl.Segment.make({ tag: tag, uniqueKeys, ...(adt && { adt }) })])
      }
      return results
    } else {
      return [[...context, Uhl.Segment.make({ tag: tag, uniqueKeys, ...(adt && { adt }) })]]
    }
  }

  throw new Error(`Invalid selection value for ${tag}: expected true, object, or single value`)
}

/**
 * Extract unique keys and context from a selection value
 */
const extractKeysAndContext = (
  value: Record<string, unknown>,
): { uniqueKeys: UniqueKeys; contextUHLs: Uhl.Uhl[]; disambiguationPath?: Uhl.Uhl } => {
  const uniqueKeys: UniqueKeysMutable = {}
  const contextUHLs: Uhl.Uhl[] = []
  let disambiguationPath: Uhl.Uhl | undefined

  for (const [key, val] of Object.entries(value)) {
    if (key === '$$') {
      // This is path disambiguation - parse it into a UHL path
      disambiguationPath = parseDisambiguationPath(val)
    } else if (key.startsWith('$')) {
      // This is a deep selection for a child hydratable
      const childTag = key.slice(1) // Remove $
      // Process the child selection recursively
      const childUHLs = processSelectionEntry(childTag, val as any, [])
      contextUHLs.push(...childUHLs)
    } else {
      // This is either a unique key or an intermediate struct property
      if (typeof val === 'string' || typeof val === 'number') {
        // Unique key value
        uniqueKeys[key] = val
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        // This could be an intermediate struct property with nested selections
        // For now, we'll treat it as an error since the spec doesn't clearly define this case
        throw new Error(`Nested objects without $ prefix not yet supported for key ${key}`)
      } else {
        throw new Error(`Invalid value for key ${key}: expected string, number, or object, got ${typeof val}`)
      }
    }
  }

  return disambiguationPath
    ? { uniqueKeys, contextUHLs, disambiguationPath }
    : { uniqueKeys, contextUHLs }
}

/**
 * Parse a $$ disambiguation path into a UHL
 * The path traces from the selected hydratable back to root
 * Each level contains parent's unique keys and one $<Tag> field
 */
const parseDisambiguationPath = (pathObj: unknown): Uhl.Uhl => {
  if (typeof pathObj !== 'object' || pathObj === null) {
    throw new Error('$$ disambiguation must be an object')
  }

  const segments: Uhl.Segment.Segment[] = [] // Building up a UHL
  let current = pathObj as Record<string, unknown>

  while (Object.keys(current).length > 0) {
    // Find the $<Tag> field in this level
    const parentTagKey = Object.keys(current).find(k => k.startsWith('$'))
    if (!parentTagKey) {
      throw new Error('Each level in $$ path must have exactly one $<Tag> field')
    }

    const parentTag = parentTagKey.slice(1) // Remove $
    const parentUniqueKeys: UniqueKeysMutable = {}

    // Extract unique keys (all non-$ fields)
    for (const [key, val] of Object.entries(current)) {
      if (!key.startsWith('$')) {
        if (typeof val === 'string' || typeof val === 'number') {
          parentUniqueKeys[key] = val
        } else {
          throw new Error(`Invalid unique key value for ${key} in $$ path`)
        }
      }
    }

    // Add segment for this parent
    segments.unshift(Uhl.Segment.make({ tag: parentTag, uniqueKeys: parentUniqueKeys }))

    // Move to next level
    const nextLevel = current[parentTagKey]
    if (typeof nextLevel === 'object' && nextLevel !== null) {
      current = nextLevel as Record<string, unknown>
    } else {
      // Reached the root
      break
    }
  }

  return segments
}
