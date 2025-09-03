import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema - UnversionedExample
// ============================================================================

export const Unversioned = S.TaggedStruct('ExampleUnversioned', {
  name: S.String,
  path: S.String,
  document: S.String,
}).annotations({
  identifier: 'UnversionedExample',
  description: 'A GraphQL example with a single document for all schema versions',
})

export type Unversioned = S.Schema.Type<typeof Unversioned>

// ============================================================================
// Constructors
// ============================================================================

export const make = Unversioned.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Unversioned)

// ============================================================================
// State Predicates
// ============================================================================

export const isEmpty = (example: Unversioned): boolean => example.document.trim().length === 0

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Unversioned)
export const decodeSync = S.decodeSync(Unversioned)
export const encode = S.encode(Unversioned)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get the document content.
 * For consistency with VersionedExample API.
 */
export const getDocument = (example: Unversioned): string => example.document
