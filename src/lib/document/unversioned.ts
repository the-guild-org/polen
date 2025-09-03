import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema
// ============================================================================

export const DocumentUnversioned = S.TaggedStruct('DocumentUnversioned', {
  document: S.String,
})

// ============================================================================
// Types
// ============================================================================

export type DocumentUnversioned = S.Schema.Type<typeof DocumentUnversioned>

// ============================================================================
// Constructors
// ============================================================================

export const make = DocumentUnversioned.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(DocumentUnversioned)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(DocumentUnversioned)
export const decodeSync = S.decodeSync(DocumentUnversioned)
export const encode = S.encode(DocumentUnversioned)