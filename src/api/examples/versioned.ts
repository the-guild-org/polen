import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'

// ============================================================================
// Schema - VersionedExample
// ============================================================================

export const VersionedExample = S.TaggedStruct('ExampleVersioned', {
  name: S.String,
  path: S.String,
  versionDocuments: S.Record({ key: S.String, value: S.String }),
  defaultDocument: S.optional(S.String),
}).annotations({
  identifier: 'VersionedExample',
  description: 'A GraphQL example with multiple version-specific documents',
})

export type VersionedExample = S.Schema.Type<typeof VersionedExample>

// ============================================================================
// Constructors
// ============================================================================

export const make = VersionedExample.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(VersionedExample)

// ============================================================================
// State Predicates
// ============================================================================

export const hasDefaultDocument = (example: VersionedExample): boolean => example.defaultDocument !== undefined

export const hasVersionDocument = (example: VersionedExample, version: string): boolean =>
  version in example.versionDocuments

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(VersionedExample)
export const decodeSync = S.decodeSync(VersionedExample)
export const encode = S.encode(VersionedExample)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get the document content for a specific version.
 * Falls back to default document if version not found and default exists.
 */
export const getDocumentForVersion = (
  example: VersionedExample,
  version: Version.Version,
): string | undefined => {
  const versionKey = Version.toString(version)
  return example.versionDocuments[versionKey] ?? example.defaultDocument
}

/**
 * Get all available versions for this example.
 */
export const getAvailableVersions = (example: VersionedExample): string[] => Object.keys(example.versionDocuments)

/**
 * Get the best available document content.
 * Prefers default document if present, otherwise first version document.
 */
export const getBestDocument = (example: VersionedExample): string | undefined => {
  if (example.defaultDocument) {
    return example.defaultDocument
  }
  const versions = Object.keys(example.versionDocuments)
  return versions.length > 0 ? example.versionDocuments[versions[0]!] : undefined
}
