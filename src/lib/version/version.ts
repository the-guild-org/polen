import { S } from '#lib/kit-temp/effect'
import { Equivalence, Order, ParseResult } from 'effect'
import { DateOnly } from '../date-only/$.js'
import { Semver as SemverLib } from '../semver/$.js'
import * as CustomVersion from './custom.js'
import * as DateVersion from './date.js'
import * as SemverVersion from './semver.js'

// Re-export member modules as namespaces
export { CustomVersion, DateVersion, SemverVersion }

// ============================================================================
// Schema
// ============================================================================

const VersionUnion = S.Union(
  SemverVersion.Semver,
  DateVersion.Date,
  CustomVersion.Custom,
)

/**
 * Schema for version strings that parses into appropriate variant
 */
export const Version = S.transformOrFail(
  S.String,
  VersionUnion,
  {
    strict: true,
    decode: (input, _, ast) => {
      // Try parsing as semver first
      try {
        SemverLib.decodeSync(input) // Validate it's a valid semver
        return ParseResult.succeed(SemverVersion.make({ value: input }))
      } catch {
        // Not a semver, continue
      }

      // Try parsing as ISO date
      try {
        const dateOnly = DateOnly.decodeSync(input)
        return ParseResult.succeed(DateVersion.make({ value: dateOnly }))
      } catch {
        // Not an ISO date, continue
      }

      // Fall back to custom version
      return ParseResult.succeed(CustomVersion.make({ value: input }))
    },
    encode: (version) => {
      switch (version._tag) {
        case 'VersionSemver':
          return ParseResult.succeed(version.value)
        case 'VersionDate':
          return ParseResult.succeed(version.value)
        case 'VersionCustom':
          return ParseResult.succeed(version.value)
      }
    },
  },
)

export type Version = S.Schema.Type<typeof Version>

// ============================================================================
// Constructors
// ============================================================================

// Note: No make constructor for transform schemas - use fromString instead

// ============================================================================
// Ordering
// ============================================================================

/**
 * Order versions with type precedence: Semver > Date > Custom
 * Within each type, use natural ordering
 */
export const order: Order.Order<Version> = Order.make((a, b) => {
  // Different types - use type precedence
  if (a._tag !== b._tag) {
    const typeOrder = { VersionSemver: 0, VersionDate: 1, VersionCustom: 2 }
    const diff = typeOrder[a._tag] - typeOrder[b._tag]
    return diff < 0 ? -1 : diff > 0 ? 1 : 0
  }

  // Same type - use type-specific ordering
  switch (a._tag) {
    case 'VersionSemver': {
      const semverA = SemverLib.decodeSync(a.value)
      const semverB = SemverLib.decodeSync((b as SemverVersion.Semver).value)
      return SemverLib.order(semverA, semverB)
    }
    case 'VersionDate':
      return DateOnly.order(a.value, (b as DateVersion.Date).value)
    case 'VersionCustom':
      return Order.string(a.value, (b as CustomVersion.Custom).value)
  }
})

export const min = Order.min(order)

export const max = Order.max(order)

export const lessThan = Order.lessThan(order)

export const greaterThan = Order.greaterThan(order)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence: Equivalence.Equivalence<Version> = Equivalence.make((a, b) => {
  if (a._tag !== b._tag) return false

  switch (a._tag) {
    case 'VersionSemver': {
      const semverA = SemverLib.decodeSync(a.value)
      const semverB = SemverLib.decodeSync((b as SemverVersion.Semver).value)
      return SemverLib.equivalence(semverA, semverB)
    }
    case 'VersionDate':
      return DateOnly.equivalence(a.value, (b as DateVersion.Date).value)
    case 'VersionCustom':
      return a.value === (b as CustomVersion.Custom).value
  }
})

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Version)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Version)
export const decodeSync = S.decodeSync(Version)
export const encode = S.encode(Version)

// ============================================================================
// Importers
// ============================================================================

export const fromString = S.decodeSync(Version)

/**
 * Create a semver version
 */
export const fromSemver = (semver: SemverLib.Semver): Version =>
  SemverVersion.make({ value: semver.version.toString() })

/**
 * Create a date version
 */
export const fromDateOnly = (date: DateOnly.DateOnly): Version => DateVersion.make({ value: date })

/**
 * Create a custom version
 */
export const fromCustom = (value: string): Version => CustomVersion.make({ value })

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Get the string representation of a version
 */
export const toString = (version: Version): string => {
  switch (version._tag) {
    case 'VersionSemver':
      return version.value
    case 'VersionDate':
      return version.value
    case 'VersionCustom':
      return version.value
  }
}

/**
 * Pattern match on Version variants
 */
export const match = <$A>(handlers: {
  onSemver: (version: SemverVersion.Semver) => $A
  onDate: (version: DateVersion.Date) => $A
  onCustom: (version: CustomVersion.Custom) => $A
}) =>
(version: Version): $A => {
  switch (version._tag) {
    case 'VersionSemver':
      return handlers.onSemver(version)
    case 'VersionDate':
      return handlers.onDate(version)
    case 'VersionCustom':
      return handlers.onCustom(version)
  }
}
