import { S } from 'graphql-kit'
import { Version } from 'graphql-kit'

// ============================================================================
// Runtime Types
// ============================================================================

/**
 * Sentinel type for unversioned schemas in the type usage index.
 */
export const UnversionedKey = S.TaggedStruct('UnversionedKey', {})
export type UnversionedKey = S.Schema.Type<typeof UnversionedKey>

/**
 * Singleton instance for unversioned key.
 */
export const UNVERSIONED_KEY = UnversionedKey.make({})

/**
 * Union type for version keys in the index.
 */
export const VersionKey = S.Union(Version.Version, UnversionedKey)
export type VersionKey = S.Schema.Type<typeof VersionKey>

// ============================================================================
// Example Reference
// ============================================================================

/**
 * Lightweight reference to an example with version.
 * Uses Class for proper Equal and Hash support needed by HashSet,
 * and provides a convenient make constructor.
 */
export class ExampleReference extends S.Class<ExampleReference>('ExampleReference')({
  /**
   * The unique name of the example
   */
  name: S.String,
  /**
   * The version this reference is for.
   * Can be null for unversioned examples.
   */
  version: S.NullOr(Version.Version),
}) {}

// ============================================================================
// Schema
// ============================================================================

/**
 * Schema for type usage index with proper HashMap transformation.
 * Structure: VersionKey → TypeName → HashSet<ExampleReference>
 *
 * S.HashMap automatically handles transformation between:
 * - Runtime: HashMap<K, V>
 * - Encoded: Array<[K, V]> for JSON serialization
 *
 * S.HashSet automatically handles:
 * - Runtime: HashSet<ExampleReference>
 * - Encoded: Array<ExampleReference> for JSON serialization
 * - Automatic deduplication based on ExampleReference's structural equality
 */
export const TypeUsageIndex = S.HashMap({
  key: VersionKey,
  value: S.HashMap({
    key: S.String,
    value: S.HashSet(ExampleReference),
  }),
}).annotations({
  identifier: 'TypeUsageIndex',
  description: 'Index mapping versions to types to example references that use those types',
})

export type TypeUsageIndex = S.Schema.Type<typeof TypeUsageIndex>
export type TypeUsageIndexEncoded = S.Schema.Encoded<typeof TypeUsageIndex>
