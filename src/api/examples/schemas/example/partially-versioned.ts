import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'
import { HashMap, Option } from 'effect'

// ============================================================================
// Schema - PartiallyVersionedExample
// ============================================================================

export const PartiallyVersioned = S.TaggedStruct('ExamplePartiallyVersioned', {
  name: S.String,
  path: S.String,
  versionDocuments: S.HashMap({ key: Version.Version, value: S.String }),
  defaultDocument: S.String, // Required - provides fallback for uncovered versions
}).annotations({
  identifier: 'PartiallyVersionedExample',
  description: 'A GraphQL example with some version-specific documents and a required default for remaining versions',
})

export type PartiallyVersioned = S.Schema.Type<typeof PartiallyVersioned>

// ============================================================================
// Constructors
// ============================================================================

export const make = PartiallyVersioned.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(PartiallyVersioned)

// ============================================================================
// State Predicates
// ============================================================================

export const hasVersionDocument = (example: PartiallyVersioned, version: Version.Version): boolean =>
  HashMap.has(example.versionDocuments, version)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(PartiallyVersioned)
export const decodeSync = S.decodeSync(PartiallyVersioned)
export const encode = S.encode(PartiallyVersioned)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get the document content for a specific version.
 * Returns explicit version if available, otherwise the default document.
 */
export const getDocumentForVersion = (
  example: PartiallyVersioned,
  version: Version.Version,
): string =>
  HashMap.get(example.versionDocuments, version).pipe(
    Option.getOrElse(() => example.defaultDocument),
  )

/**
 * Get all explicitly versioned versions for this example.
 */
export const getExplicitVersions = (example: PartiallyVersioned): Version.Version[] =>
  Array.from(HashMap.keys(example.versionDocuments))
