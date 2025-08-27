import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { S } from '#lib/kit-temp/effect'
import { Order } from 'effect'

// ============================================================================
// Schema
// ============================================================================

export const Revision = S.TaggedStruct('Revision', {
  date: DateOnly.DateOnly,
  changes: S.Array(Change.Change),
}).annotations({
  identifier: 'Revision',
  title: 'Revision',
  description: 'A revision in the schema history',
})

export type Revision = S.Schema.Type<typeof Revision>

// ============================================================================
// Constructors
// ============================================================================

/**
 * Create a Revision instance with validation
 */
export const make = Revision.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Revision)

// ============================================================================
// Ordering
// ============================================================================

export const order: Order.Order<Revision> = Order.mapInput(DateOnly.order, (revision) => revision.date)

export const min = Order.min(order)

export const max = Order.max(order)

export const lessThan = Order.lessThan(order)

export const greaterThan = Order.greaterThan(order)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Revision)

export const decodeSync = S.decodeSync(Revision)

export const encode = S.encode(Revision)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Revision)
