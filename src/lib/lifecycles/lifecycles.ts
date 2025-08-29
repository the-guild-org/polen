import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { Match } from 'effect'

// ============================================================================
// Lifecycles Type - Simple Index
// ============================================================================

/**
 * A change entry tracking when a type or field was modified
 */
export interface ChangeEntry {
  /** The change that occurred */
  change: Change.Change
  /** The revision containing this change */
  revision: Revision.Revision
  /** The schema this change belongs to */
  schema: Schema.Schema
}

/**
 * Lifecycles is a simple index mapping type names to their change history
 */
export type Lifecycles = Record<string, ChangeEntry[]>

// ============================================================================
// Since Types - For tracking when things were introduced
// ============================================================================

/**
 * Represents when a type or field was introduced
 */
export type Since =
  | { _tag: 'initial' }
  | { _tag: 'added'; revision: Revision.Revision; change: Change.Change; schema: Schema.Schema }

// ============================================================================
// Domain Logic - Create Function
// ============================================================================

/**
 * Extract the type name from a change
 */
const extractTypeNameFromChange = (change: Change.Change): string | null => {
  return Match.value(change).pipe(
    Match.tag('TYPE_ADDED', (c) => c.name),
    Match.tag('TYPE_REMOVED', (c) => c.name),
    Match.tag('FIELD_ADDED', (c) => c.typeName),
    Match.tag('FIELD_REMOVED', (c) => c.typeName),
    Match.tag('INPUT_FIELD_ADDED', (c) => c.inputName),
    Match.tag('INPUT_FIELD_REMOVED', (c) => c.inputName),
    Match.tag('ENUM_VALUE_ADDED', (c) => c.enumName),
    Match.tag('ENUM_VALUE_REMOVED', (c) => c.enumName),
    Match.tag('UNION_MEMBER_ADDED', (c) => c.unionName),
    Match.tag('UNION_MEMBER_REMOVED', (c) => c.unionName),
    Match.tag('OBJECT_TYPE_INTERFACE_ADDED', (c) => c.objectName),
    Match.tag('OBJECT_TYPE_INTERFACE_REMOVED', (c) => c.objectName),
    Match.orElse(() => null),
  )
}

/**
 * Build lifecycle data from a single schema
 */
export const createFromSchema = (schema: Schema.Schema): Lifecycles => {
  const lifecycles: Lifecycles = {}

  // Process all revisions for this schema
  for (const revision of schema.revisions) {
    // Process all changes in this revision
    for (const change of revision.changes) {
      const typeName = extractTypeNameFromChange(change)
      if (typeName) {
        if (!lifecycles[typeName]) {
          lifecycles[typeName] = []
        }
        lifecycles[typeName].push({
          change, // reference to existing change object
          revision, // reference to existing revision object
          schema, // reference to existing schema object
        })
      }
    }
  }

  return lifecycles
}

/**
 * Build lifecycle data from a catalog
 */
export const create = (catalog: Catalog.Catalog): Lifecycles => {
  const lifecycles: Lifecycles = {}

  const processSchema = (schema: Schema.Schema) => {
    // Process all revisions for this schema
    for (const revision of schema.revisions) {
      // Process all changes in this revision
      for (const change of revision.changes) {
        const typeName = extractTypeNameFromChange(change)
        if (typeName) {
          if (!lifecycles[typeName]) {
            lifecycles[typeName] = []
          }
          lifecycles[typeName].push({
            change, // reference to existing change object
            revision, // reference to existing revision object
            schema, // reference to existing schema object
          })
        }
      }
    }
  }

  // Process based on catalog type
  Catalog.fold(
    // Versioned catalog - process each versioned schema
    (versioned) => {
      for (const schema of versioned.entries) {
        processSchema(schema)
      }
    },
    // Unversioned catalog - process the single schema
    (unversioned) => {
      processSchema(unversioned.schema)
    },
  )(catalog)

  return lifecycles
}

// ============================================================================
// Domain Logic - Utility Functions for Types
// ============================================================================

/**
 * Get when a type was introduced (initial or added)
 */
export const getTypeSince = (
  lifecycles: Lifecycles,
  typeName: string,
  currentSchema?: Schema.Schema,
): Since | undefined => {
  const entries = lifecycles[typeName]

  // If no entries at all, type doesn't exist in any form
  if (!entries || entries.length === 0) return undefined

  // Look for TYPE_ADDED change
  for (const entry of entries) {
    if (entry.change._tag === 'TYPE_ADDED' && entry.change.name === typeName) {
      // If we have a current version and this entry has a version, check if it's not after current
      if (currentSchema && entry.schema._tag === 'SchemaVersioned') {
        if (currentSchema._tag !== 'SchemaVersioned') throw new Error('todo -- version/unversioned mismatch!')
        const entryVer = entry.schema.version
        if (Version.greaterThan(entryVer, currentSchema.version)) {
          continue // Skip entries from future versions
        }
      }

      // Found when it was added
      return {
        _tag: 'added',
        revision: entry.revision,
        change: entry.change,
        schema: entry.schema,
      }
    }
  }

  // No TYPE_ADDED found, so it must have existed from initial schema
  return { _tag: 'initial' }
}

/**
 * Get the date when a type was added
 * Shows when the type was first introduced via TYPE_ADDED change
 * Returns undefined if type existed from initial schema (no TYPE_ADDED change)
 */
export const getTypeAddedDate = (
  lifecycles: Lifecycles,
  typeName: string,
  currentVersion?: string,
): Date | undefined => {
  const entries = lifecycles[typeName]
  if (!entries) return undefined

  // Parse current version if provided
  const currentVer = currentVersion ? Version.fromString(currentVersion) : undefined

  // Find the earliest TYPE_ADDED change that's not after the current version
  let earliestDate: Date | undefined

  for (const entry of entries) {
    if (entry.change._tag === 'TYPE_ADDED' && entry.change.name === typeName) {
      // If we have a current version and this entry has a version, check if it's not after current
      if (currentVer && entry.schema._tag === 'SchemaVersioned') {
        const entryVer = entry.schema.version
        if (Version.greaterThan(entryVer, currentVer)) {
          continue // Skip entries from future versions
        }
      }

      const date = new Date(entry.revision.date)
      if (!earliestDate || date < earliestDate) {
        earliestDate = date
      }
    }
  }

  return earliestDate
}

/**
 * Get the date when a type was removed
 * For reference docs: Returns undefined if type exists in current version (no removal badge should be shown)
 * For changelog: Shows removal date if it happened in any version
 */
export const getTypeRemovedDate = (
  lifecycles: Lifecycles,
  typeName: string,
  currentSchema?: Schema.Schema,
): Date | undefined => {
  const entries = lifecycles[typeName]
  if (!entries) return undefined

  // If no current schema specified (e.g., in changelog), show any removal
  if (!currentSchema) {
    // Find the latest TYPE_REMOVED change
    let latestDate: Date | undefined

    for (const entry of entries) {
      if (entry.change._tag === 'TYPE_REMOVED' && entry.change.name === typeName) {
        const date = new Date(entry.revision.date)
        if (!latestDate || date > latestDate) {
          latestDate = date
        }
      }
    }

    return latestDate
  }

  // For reference docs with current schema:
  // Only show removal if it happens AFTER the current version (future removal warning)
  // If the type exists in the current version, it cannot have been removed
  const currentVer = Schema.getVersion(currentSchema)
  if (!currentVer) return undefined

  for (const entry of entries) {
    if (entry.change._tag === 'TYPE_REMOVED' && entry.change.name === typeName) {
      // Check if removal is after current version
      if (entry.schema._tag === 'SchemaVersioned') {
        if (currentSchema._tag !== 'SchemaVersioned') throw new Error('todo -- version/unversioned mismatch!')
        const entryVer = entry.schema.version
        if (Version.greaterThan(entryVer, currentVer)) {
          // This is a future removal - could show as a deprecation warning
          // But for now, we don't show future removals
          return undefined
        }
      }
    }
  }

  // No removal found or removal is in the past (but type still exists in current version)
  return undefined
}

/**
 * Check if a type is currently available (not removed)
 */
export const isTypeCurrentlyAvailable = (lifecycles: Lifecycles, typeName: string): boolean => {
  const entries = lifecycles[typeName]
  if (!entries || entries.length === 0) return false

  // Check if type was ever added
  const wasAdded = entries.some(e => e.change._tag === 'TYPE_ADDED' && e.change.name === typeName)
  if (!wasAdded) return false

  // Check if it was subsequently removed
  const addedDate = getTypeAddedDate(lifecycles, typeName)
  const removedDate = getTypeRemovedDate(lifecycles, typeName)

  if (!addedDate) return false
  if (!removedDate) return true

  // If both dates exist, type is available if it was re-added after being removed
  // This would require multiple add/remove cycles - for now assume removed means not available
  return false
}

// ============================================================================
// Domain Logic - Utility Functions for Fields
// ============================================================================

/**
 * Get when a field was introduced (initial or added)
 */
export const getFieldSince = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
  currentSchema?: Schema.Schema,
): Since | undefined => {
  const entries = lifecycles[typeName]

  // If no entries for the type, we can't determine field info
  if (!entries || entries.length === 0) return undefined

  // Get current version from schema if provided
  const currentVer = currentSchema ? Schema.getVersion(currentSchema) : undefined

  // Look for FIELD_ADDED or INPUT_FIELD_ADDED change
  for (const entry of entries) {
    const isFieldAdded = (entry.change._tag === 'FIELD_ADDED'
      && entry.change.typeName === typeName
      && entry.change.fieldName === fieldName)
      || (entry.change._tag === 'INPUT_FIELD_ADDED'
        && entry.change.inputName === typeName
        && entry.change.fieldName === fieldName)

    if (isFieldAdded) {
      // If we have a current version and this entry has a version, check if it's not after current
      if (currentVer && entry.schema._tag === 'SchemaVersioned') {
        if (currentSchema && currentSchema._tag !== 'SchemaVersioned') {
          throw new Error('todo -- version/unversioned mismatch!')
        }
        const entryVer = entry.schema.version
        if (Version.greaterThan(entryVer, currentVer)) {
          continue // Skip entries from future versions
        }
      }

      // Found when it was added
      return {
        _tag: 'added',
        revision: entry.revision,
        change: entry.change,
        schema: entry.schema,
      }
    }
  }

  // No FIELD_ADDED found, so it must have existed from initial schema
  // But only if the type itself exists (has some entries)
  return { _tag: 'initial' }
}

/**
 * Get the date when a field was added
 * Shows when the field was first introduced via FIELD_ADDED change
 * Returns undefined if field existed from initial schema (no FIELD_ADDED change)
 */
export const getFieldAddedDate = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
  currentSchema?: Schema.Schema,
): Date | undefined => {
  const entries = lifecycles[typeName]
  if (!entries) return undefined

  // Get current version from schema if provided
  const currentVer = currentSchema ? Schema.getVersion(currentSchema) : undefined

  // Find the earliest FIELD_ADDED or INPUT_FIELD_ADDED change for this field
  let earliestDate: Date | undefined

  for (const entry of entries) {
    const isFieldAdded = (entry.change._tag === 'FIELD_ADDED'
      && entry.change.typeName === typeName
      && entry.change.fieldName === fieldName)
      || (entry.change._tag === 'INPUT_FIELD_ADDED'
        && entry.change.inputName === typeName
        && entry.change.fieldName === fieldName)

    if (isFieldAdded) {
      // If we have a current version and this entry has a version, check if it's not after current
      if (currentVer && entry.schema._tag === 'SchemaVersioned') {
        if (currentSchema && currentSchema._tag !== 'SchemaVersioned') {
          throw new Error('todo -- version/unversioned mismatch!')
        }
        const entryVer = entry.schema.version
        if (Version.greaterThan(entryVer, currentVer)) {
          continue // Skip entries from future versions
        }
      }

      const date = new Date(entry.revision.date)
      if (!earliestDate || date < earliestDate) {
        earliestDate = date
      }
    }
  }

  return earliestDate
}

/**
 * Get the date when a field was removed
 * For reference docs: Returns undefined if field exists in current version (no removal badge should be shown)
 * For changelog: Shows removal date if it happened in any version
 */
export const getFieldRemovedDate = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
  currentSchema?: Schema.Schema,
): Date | undefined => {
  const entries = lifecycles[typeName]
  if (!entries) return undefined

  // If no current schema specified (e.g., in changelog), show any removal
  if (!currentSchema) {
    // Find the latest FIELD_REMOVED or INPUT_FIELD_REMOVED change for this field
    let latestDate: Date | undefined

    for (const entry of entries) {
      const isFieldRemoved = (entry.change._tag === 'FIELD_REMOVED'
        && entry.change.typeName === typeName
        && entry.change.fieldName === fieldName)
        || (entry.change._tag === 'INPUT_FIELD_REMOVED'
          && entry.change.inputName === typeName
          && entry.change.fieldName === fieldName)

      if (isFieldRemoved) {
        const date = new Date(entry.revision.date)
        if (!latestDate || date > latestDate) {
          latestDate = date
        }
      }
    }

    return latestDate
  }

  // For reference docs with current version:
  // If the field exists in the current version's schema, it cannot have been removed
  // So we return undefined (no removal badge should be shown)
  return undefined
}

/**
 * Check if a field is currently available (not removed)
 */
export const isFieldCurrentlyAvailable = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
): boolean => {
  const entries = lifecycles[typeName]
  if (!entries || entries.length === 0) return false

  // Check if field was ever added
  const addedDate = getFieldAddedDate(lifecycles, typeName, fieldName)
  if (!addedDate) return false

  // Check if it was subsequently removed
  const removedDate = getFieldRemovedDate(lifecycles, typeName, fieldName)
  if (!removedDate) return true

  // If both dates exist, field is not available if it was removed
  return false
}

// ============================================================================
// Domain Logic - Compatibility Functions (for existing code)
// ============================================================================

/**
 * Get field lifecycle info (for compatibility with existing UI code)
 */
export const getFieldLifecycle = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
): { events: ChangeEntry[] } | undefined => {
  const entries = lifecycles[typeName]
  if (!entries) return undefined

  // Filter entries related to this specific field
  const fieldEntries = entries.filter(entry => {
    return (entry.change._tag === 'FIELD_ADDED'
      && entry.change.typeName === typeName
      && entry.change.fieldName === fieldName)
      || (entry.change._tag === 'FIELD_REMOVED'
        && entry.change.typeName === typeName
        && entry.change.fieldName === fieldName)
      || (entry.change._tag === 'INPUT_FIELD_ADDED'
        && entry.change.inputName === typeName
        && entry.change.fieldName === fieldName)
      || (entry.change._tag === 'INPUT_FIELD_REMOVED'
        && entry.change.inputName === typeName
        && entry.change.fieldName === fieldName)
  })

  if (fieldEntries.length === 0) return undefined

  // Return in a format compatible with existing code that expects an object with events
  return { events: fieldEntries }
}

/**
 * Get type lifecycle info (for compatibility with existing UI code)
 */
export const getTypeLifecycle = (lifecycles: Lifecycles, typeName: string): { events: ChangeEntry[] } | undefined => {
  const entries = lifecycles[typeName]
  if (!entries) return undefined

  // Filter entries related to type-level changes
  const typeEntries = entries.filter(entry => {
    return entry.change._tag === 'TYPE_ADDED' || entry.change._tag === 'TYPE_REMOVED'
  })

  if (typeEntries.length === 0) return undefined

  return { events: typeEntries }
}
