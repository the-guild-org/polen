import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'
import { HashMap, Option } from 'effect'

// ============================================================================
// Schema
// ============================================================================

export const DocumentPartiallyVersioned = S.TaggedStruct('DocumentPartiallyVersioned', {
  versionDocuments: S.HashMap({
    key: Version.Version,
    value: S.String,
  }),
  defaultDocument: S.String,
})

// ============================================================================
// Types
// ============================================================================

export type DocumentPartiallyVersioned = S.Schema.Type<typeof DocumentPartiallyVersioned>

// ============================================================================
// Constructors
// ============================================================================

export const make = DocumentPartiallyVersioned.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(DocumentPartiallyVersioned)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(DocumentPartiallyVersioned)
export const decodeSync = S.decodeSync(DocumentPartiallyVersioned)
export const encode = S.encode(DocumentPartiallyVersioned)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get document for a specific version, falling back to default if not found.
 */
export const getDocumentForVersion = (
  document: DocumentPartiallyVersioned,
  version: Version.Version,
): string =>
  HashMap.get(document.versionDocuments, version).pipe(
    Option.getOrElse(() => document.defaultDocument)
  )