import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'

export const DocumentContent = S.String

// ============================================================================
// Schema - VersionedExample
// ============================================================================

export const Versioned = S.TaggedStruct('ExampleVersioned', {
  name: S.String,
  path: S.String,
  versionDocuments: S.HashMap({
    key: Version.Version,
    value: DocumentContent,
  }),
}).annotations({
  identifier: 'VersionedExample',
  description: 'A GraphQL example with explicit documents for all schema versions',
})

export type Versioned = S.Schema.Type<typeof Versioned>

// ============================================================================
// Constructors
// ============================================================================

export const make = Versioned.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Versioned)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Versioned)
export const decodeSync = S.decodeSync(Versioned)
export const encode = S.encode(Versioned)
