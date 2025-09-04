import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'

// ============================================================================
// Schema
// ============================================================================

export const DocumentVersioned = S.TaggedStruct('DocumentVersioned', {
  versionDocuments: S.HashMap({
    key: Version.Version,
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
