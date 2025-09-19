import { S } from '#dep/effect'
import { Example } from './example/$.js'
import { TypeUsageIndex } from './type-usage-index.js'

// ============================================================================
// Schema and Type
// ============================================================================

export const Catalog = S.Struct({
  /**
   * Array of GraphQL examples in the catalog.
   */
  examples: S.Array(Example.Example),
  /**
   * Optional index file metadata.
   */
  index: S.optional(S.Struct({
    path: S.String,
  })),
  /**
   * Index mapping GraphQL types to examples that use them.
   * Structure: VersionKey → TypeName → Example[]
   */
  typeUsageIndex: S.optional(TypeUsageIndex),
}).annotations({
  identifier: 'ExamplesCatalog',
  description: 'A catalog of GraphQL examples with optional index file and type usage index',
})

export type Catalog = S.Schema.Type<typeof Catalog>

// ============================================================================
// Constructors
// ============================================================================

export const make = Catalog.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Catalog)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Catalog)
export const decodeSync = S.decodeSync(Catalog)
export const encode = S.encode(Catalog)
export const encodeSync = S.encodeSync(Catalog)
