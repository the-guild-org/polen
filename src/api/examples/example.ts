import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'
import { Match, Order } from 'effect'
import * as UnversionedExample from './unversioned.js'
import * as VersionedExample from './versioned.js'

// ============================================================================
// Schema - Example
// ============================================================================

export const Example = S.Union(VersionedExample.VersionedExample, UnversionedExample.UnversionedExample).annotations({
  identifier: 'Example',
  description: 'A GraphQL example that can be either versioned or unversioned',
})

export type Example = S.Schema.Type<typeof Example>

// ============================================================================
// Constructors
// ============================================================================

// Note: No make constructor for union types - use member constructors

// ============================================================================
// Ordering
// ============================================================================

export const order: Order.Order<Example> = Order.mapInput(
  Order.string,
  (example: Example) => example.name,
)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalent = S.equivalence(Example)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Example)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Example)
export const decodeSync = S.decodeSync(Example)
export const encode = S.encode(Example)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get the best available document content for an example.
 * For versioned examples, prefers default document if present.
 * For unversioned examples, returns the single document.
 */
export const getBestDocument = (example: Example): string | undefined =>
  Match.value(example).pipe(
    Match.tagsExhaustive({
      ExampleUnversioned: (e) => e.document,
      ExampleVersioned: VersionedExample.getBestDocument,
    }),
  )
