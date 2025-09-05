import { S } from '#lib/kit-temp/effect'
import { VersionSelection } from '#lib/version-selection/$'
import { Version } from '#lib/version/$'
import { HashMap, Option } from 'effect'

// ============================================================================
// Schema
// ============================================================================

export const DocumentVersioned = S.TaggedStruct('DocumentVersioned', {
  /**
   * Map from version selection (single or set) to document content.
   * Supports:
   * - Single version → document (e.g., v1 → "query for v1")
   * - Version set → document (e.g., {v2,v3} → "shared query")
   */
  versionDocuments: S.HashMap({
    key: VersionSelection.VersionSelection,
    value: S.String,
  }),
})

// ============================================================================
// Types
// ============================================================================

export type DocumentVersioned = typeof DocumentVersioned.Type

// ============================================================================
// Constructors
// ============================================================================

export const make = DocumentVersioned.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(DocumentVersioned)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(DocumentVersioned)
export const decodeSync = S.decodeSync(DocumentVersioned)
export const encode = S.encode(DocumentVersioned)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get document for a specific version
 */
export const getDocumentForVersion = (
  doc: DocumentVersioned,
  version: Version.Version,
): string | null => {
  // Try exact match first (single version key)
  const exactMatch = HashMap.get(doc.versionDocuments, version)
  if (Option.isSome(exactMatch)) {
    return exactMatch.value
  }

  // Check version sets
  for (const [selection, content] of HashMap.entries(doc.versionDocuments)) {
    if (VersionSelection.isSet(selection) && VersionSelection.contains(selection, version)) {
      return content
    }
  }

  return null
}

/**
 * Get all version selections (for picker UI)
 */
export const getSelections = (doc: DocumentVersioned): VersionSelection.VersionSelection[] =>
  Array.from(HashMap.keys(doc.versionDocuments))

/**
 * Get all individual versions covered by this document
 */
export const getAllVersions = (doc: DocumentVersioned): Version.Version[] => {
  const versions = new Set<Version.Version>()
  for (const selection of HashMap.keys(doc.versionDocuments)) {
    for (const v of VersionSelection.toVersions(selection)) {
      versions.add(v)
    }
  }
  return Array.from(versions)
}
