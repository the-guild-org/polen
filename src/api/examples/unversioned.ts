import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema - UnversionedExample
// ============================================================================

export const UnversionedExample = S.TaggedStruct('ExampleUnversioned', {
  name: S.String,
  path: S.String,
  document: S.String,
}).annotations({
  identifier: 'UnversionedExample',
  description: 'A GraphQL example with a single document for all schema versions',
})

export type UnversionedExample = S.Schema.Type<typeof UnversionedExample>

// ============================================================================
// Constructors
// ============================================================================

export const make = UnversionedExample.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(UnversionedExample)

// ============================================================================
// State Predicates
// ============================================================================

export const isEmpty = (example: UnversionedExample): boolean => example.document.trim().length === 0

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(UnversionedExample)
export const decodeSync = S.decodeSync(UnversionedExample)
export const encode = S.encode(UnversionedExample)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get the document content.
 * For consistency with VersionedExample API.
 */
export const getDocument = (example: UnversionedExample): string => example.document
