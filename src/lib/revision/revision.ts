import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Hydra } from '#lib/hydra/$'
import { S } from '#lib/kit-temp/effect'
import { Order } from 'effect'

// ============================================================================
// Schema
// ============================================================================

export const Revision = Hydra.Schema.Hydratable(
  S.TaggedStruct('Revision', {
    date: DateOnly.DateOnly,
    changes: S.Array(Change.Change),
  }).annotations({
    identifier: 'Revision',
    title: 'Revision',
    description: 'A revision in the schema history',
  }),
  { keys: ['date'] },
)

export type Revision = S.Schema.Type<typeof Revision>

// ============================================================================
// Constructors
// ============================================================================

/**
 * Create a Revision instance with validation
 */
export const make = Revision.make

/**
 * Create a dehydrated Revision with only unique keys.
 * @param input - Object containing the date field in encoded form (string)
 * @returns Dehydrated revision with _tag, date, and _dehydrated marker
 */
export const makeDehydrated = Revision.makeDehydrated

/**
 * Dehydrate a Revision instance, keeping only unique keys in encoded form.
 * @param value - A hydrated Revision instance
 * @returns Dehydrated revision with _tag, date (encoded), and _dehydrated marker
 */
export const dehydrate = Revision.dehydrate

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
