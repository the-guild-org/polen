import { S } from '#lib/kit-temp/effect'
import { DateOnly } from '../date-only/$.js'

// ============================================================================
// Schema
// ============================================================================

export const Date = S.TaggedStruct('VersionDate', {
  value: DateOnly.DateOnly,
}).annotations({
  identifier: 'Date',
  title: 'Date',
  description: 'A version represented as a date (YYYY-MM-DD)',
  adt: { name: 'Version' },
})

// ============================================================================
// Type
// ============================================================================

export type Date = S.Schema.Type<typeof Date>

// ============================================================================
// Constructors
// ============================================================================

export const make = Date.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Date)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Date)
export const decodeSync = S.decodeSync(Date)
export const encode = S.encode(Date)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Date)
