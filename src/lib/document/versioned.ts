import { S } from '#lib/kit-temp/effect'
import { VersionCoverage } from '#lib/version-coverage'
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
    key: VersionCoverage.VersionCoverage,
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
export const getContentForVersion = (
  doc: DocumentVersioned,
  version: Version.Version,
): Option.Option<string> => {
  // Try exact match first (single version key)
  const exactMatch = HashMap.get(doc.versionDocuments, version)
  if (Option.isSome(exactMatch)) {
    return Option.some(exactMatch.value)
  }

  // Check version sets
  for (const [selection, content] of HashMap.entries(doc.versionDocuments)) {
    if (VersionCoverage.isSet(selection) && VersionCoverage.contains(selection, version)) {
      return Option.some(content)
    }
  }

  return Option.none()
}

/**
 * Get all individual versions covered by this document
 */
export const getAllVersions = (doc: DocumentVersioned): Version.Version[] => {
  const versions = new Set<Version.Version>()
  for (const selection of HashMap.keys(doc.versionDocuments)) {
    for (const v of VersionCoverage.toVersions(selection)) {
      versions.add(v)
    }
  }
  return Array.from(versions)
}
/**
 * Get document content for the latest version available in the document
 */
export const getContentForLatestVersionOrThrow = (doc: DocumentVersioned): string => {
  const versions = getAllVersions(doc)

  if (versions.length === 0) {
    throw new Error('No versions found in document')
  }

  // Use Version.max with reduce to find the latest version
  const latestVersion = versions.reduce(Version.max)

  const contentOption = getContentForVersion(doc, latestVersion)
  if (Option.isNone(contentOption)) {
    throw new Error('Latest version not found in document')
  }
  return contentOption.value
}
