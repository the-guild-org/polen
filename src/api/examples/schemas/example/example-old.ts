import { S } from '#lib/kit-temp/effect'
import { Order } from 'effect'
import * as PartiallyVersionedExample from './partially-versioned.js'
import * as UnversionedExample from './unversioned.js'
import * as VersionedExample from './versioned.js'

// ============================================================================
// Schema - Example
// ============================================================================

export const Example = S.Union(
  VersionedExample.Versioned,
  PartiallyVersionedExample.PartiallyVersioned,
  UnversionedExample.Unversioned,
).annotations({
  identifier: 'Example',
  description: 'A GraphQL example that can be fully versioned, partially versioned, or unversioned',
})

export type Example = S.Schema.Type<typeof Example>

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
