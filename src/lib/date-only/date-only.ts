import { S } from '#lib/kit-temp/effect'
import { Order } from 'effect'

// ============================================================================
// Schema
// ============================================================================

export const DateOnly = S.String.pipe(
  S.pattern(/^\d{4}-\d{2}-\d{2}$/),
  S.annotations({
    identifier: 'DateOnly',
    title: 'Date Only',
    description: 'A date-only value in YYYY-MM-DD format',
    examples: ['2024-01-15', '2023-12-31'],
  }),
  S.brand('DateOnly'),
)

// ============================================================================
// Type
// ============================================================================

export type DateOnly = S.Schema.Type<typeof DateOnly>

// ============================================================================
// Constructors
// ============================================================================

export const make = DateOnly.make

// ============================================================================
// Ordering
// ============================================================================

export const order: Order.Order<DateOnly> = Order.mapInput(Order.string, (date) => date)

export const min = Order.min(order)

export const max = Order.max(order)

export const lessThan = Order.lessThan(order)

export const greaterThan = Order.greaterThan(order)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(DateOnly)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(DateOnly)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(DateOnly)

export const decodeSync = S.decodeSync(DateOnly)

export const encode = S.encode(DateOnly)

// ============================================================================
// Importers
// ============================================================================

export const fromDate = (date: Date): DateOnly => {
  const dateString = date.toISOString().split('T')[0]!
  return make(dateString)
}

// ============================================================================
// Exporters
// ============================================================================

export const toDate = (date: DateOnly): Date => new Date(date + 'T00:00:00.000Z')

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get the year from a date
 */
export const getYear = (date: DateOnly): number => parseInt(date.substring(0, 4), 10)

/**
 * Get the month from a date (1-12)
 */
export const getMonth = (date: DateOnly): number => parseInt(date.substring(5, 7), 10)

/**
 * Get the day from a date (1-31)
 */
export const getDay = (date: DateOnly): number => parseInt(date.substring(8, 10), 10)

/**
 * Calculate the number of days between two dates
 * @param from - The starting date
 * @param to - The ending date
 * @returns Number of days between the dates (positive if to > from, negative otherwise)
 */
export const getDaysBetween = (from: DateOnly, to: DateOnly): number => {
  const fromDate = toDate(from)
  const toDate_ = toDate(to)
  const diffMs = toDate_.getTime() - fromDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
