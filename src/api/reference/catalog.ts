import { S } from '#dep/effect'
import { FsLoc } from '@wollybeard/kit'

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
    path: FsLoc.AbsFile,
  })),
}).annotations({
  identifier: 'ReferenceCatalog',
  description: 'A catalog of reference documentation metadata',
})

export type Catalog = typeof Catalog.Type

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
