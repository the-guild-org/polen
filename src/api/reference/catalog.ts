import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema and Type
// ============================================================================

export const Catalog = S.Struct({
  /**
   * Optional index file metadata for custom reference landing page.
   * If not provided, the app will redirect to the Query type.
   */
  index: S.optional(S.Struct({
    /**
     * Path to the index.md or index.mdx file
     */
    path: S.String,
  })),
}).annotations({
  identifier: 'ReferenceCatalog',
  description: 'A catalog of reference documentation metadata',
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
// State Predicates
// ============================================================================

/**
 * Check if the catalog has a custom index page
 */
export const hasIndex = (catalog: Catalog): boolean => {
  return catalog.index !== undefined
}

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Catalog)
export const decodeSync = S.decodeSync(Catalog)
export const encode = S.encode(Catalog)
export const encodeSync = S.encodeSync(Catalog)
