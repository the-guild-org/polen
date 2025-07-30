import { FilePathSegment } from '../../../lib/file-path/$.js'
import { UHL } from '../uhl/$.js'

// ============================================================================
// Index Types
// ============================================================================

/**
 * Index entry mapping key to file path
 */
export interface IndexEntry {
  readonly key: string
  readonly path: string
  readonly metadata?: unknown
}

export type IndexData = Map<string, unknown>

/**
 * Bridge index for O(1) asset lookups
 */
export interface Index {
  readonly data: IndexData
}

// ============================================================================
// Index Key Operations
// ============================================================================

/**
 * Generate an index key from a UHL
 *
 * This function represents the transformation flow:
 * Selection → ParsedSelection → UHL → string key
 *
 * Format: DATA_TYPE[___DATA_TYPE]*
 * Where DATA_TYPE = <adt>@<member>|<non_adt>[_<key>@<val>]*
 *
 * Examples:
 * - "Schema@SchemaVersioned_version@1.0.0"
 * - "Revision_date@2024-01-15___Schema@SchemaUnversioned"
 */
export const uhlToIndexKey = (
  uhl: UHL.UHL,
): string => {
  return UHL.toString(uhl)
}

/**
 * Parse an index key back into UHL
 * This is the inverse of uhlToIndexKey
 */
export const parseIndexKey = (key: string): UHL.UHL => {
  return UHL.fromString(key)
}

/**
 * Parse an index key back into UHL
 * This is the inverse of uhlToIndexKey
 */
export const parseFileName = (fileName: string): UHL.UHL => {
  const indexKey = filePathToIndexKey(fileName)
  return UHL.fromString(indexKey)
}

/**
 * Generate a file path from an index key
 *
 * Examples:
 * - "Schema@SchemaVersioned_version@1.0.0" -> "Schema@SchemaVersioned_version@1.0.0.json"
 * - "Revision_date@2024-01-15___Schema@SchemaUnversioned" -> "Revision_date@2024-01-15___Schema@SchemaUnversioned.json"
 */
export const indexKeyToFileName = (key: string): FilePathSegment.FilePathSegment =>
  FilePathSegment.ensureExtension(FilePathSegment.make(key), 'json')

/**
 * Convert a file path back to an index key by removing the .json extension
 * This is the inverse of indexKeyToFilePath
 *
 * Examples:
 * - "Schema@SchemaVersioned_version@1.0.0.json" -> "Schema@SchemaVersioned_version@1.0.0"
 * - "Revision_date@2024-01-15___Schema@SchemaUnversioned.json" -> "Revision_date@2024-01-15___Schema@SchemaUnversioned"
 */
export const filePathToIndexKey = (filePath: string): string => {
  // Remove the .json extension to get back the index key
  const withoutExt = FilePathSegment.withoutExtension(filePath as FilePathSegment.FilePathSegment)
  return withoutExt
}

export const make = (): Index => ({
  data: new Map(),
})

/**
 * Add a value to the index
 */
export const add = (index: Index, uhl: UHL.UHL, value: unknown): void => {
  index.data.set(UHL.toString(uhl), value)
}
