import { S } from '#lib/kit-temp/effect'
import { DocumentPartiallyVersioned } from './partially-versioned.js'
import { DocumentUnversioned } from './unversioned.js'
import { DocumentVersioned } from './versioned.js'

// ============================================================================
// Schema
// ============================================================================

/**
 * A Document represents versionable content that can be:
 * - Unversioned: A single document with no version support
 * - Versioned: Multiple versions with no default fallback
 * - PartiallyVersioned: Multiple versions with a default fallback
 */
export const Document = S.Union(
  DocumentUnversioned,
  DocumentVersioned,
  DocumentPartiallyVersioned,
)

// ============================================================================
// Types
// ============================================================================

export type Document = typeof Document.Type

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Document)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Document)
export const decodeSync = S.decodeSync(Document)
export const encode = S.encode(Document)
