import { describe, expect, it } from 'vitest'
import { DateOnly } from '../date-only/$.js'
import { Semver } from '../semver/$.js'
import { Version } from './$.js'

describe('Version', () => {
  describe('decoding', () => {
    it('decodes semver strings as SemverVersion', () => {
      const version = Version.decodeSync('1.2.3')
      expect(version._tag).toBe('VersionSemver')
      expect(Version.toString(version)).toBe('1.2.3')
    })

    it('decodes date strings as DateVersion', () => {
      const version = Version.decodeSync('2024-01-15')
      expect(version._tag).toBe('VersionDate')
      expect(Version.toString(version)).toBe('2024-01-15')
    })

    it('decodes other strings as CustomVersion', () => {
      const version = Version.decodeSync('v1.0-beta')
      expect(version._tag).toBe('VersionCustom')
      expect(Version.toString(version)).toBe('v1.0-beta')
    })

    it('prefers semver over date when ambiguous', () => {
      // This is not a real case since semver and date patterns don't overlap,
      // but tests the precedence logic
      const version = Version.decodeSync('1.0.0')
      expect(version._tag).toBe('VersionSemver')
    })
  })

  describe('ordering', () => {
    it('orders by type precedence: Semver > Date > Custom', () => {
      const v1 = Version.decodeSync('1.0.0') // Semver
      const v2 = Version.decodeSync('2024-01-15') // Date
      const v3 = Version.decodeSync('custom') // Custom

      expect(Version.order(v1, v2)).toBeLessThan(0)
      expect(Version.order(v2, v3)).toBeLessThan(0)
      expect(Version.order(v1, v3)).toBeLessThan(0)
    })

    it('orders within semver type', () => {
      const v1 = Version.decodeSync('1.0.0')
      const v2 = Version.decodeSync('2.0.0')

      expect(Version.order(v1, v2)).toBeLessThan(0)
      expect(Version.order(v2, v1)).toBeGreaterThan(0)
    })

    it('orders within date type', () => {
      const v1 = Version.decodeSync('2024-01-15')
      const v2 = Version.decodeSync('2024-02-15')

      expect(Version.order(v1, v2)).toBeLessThan(0)
      expect(Version.order(v2, v1)).toBeGreaterThan(0)
    })

    it('orders within custom type', () => {
      const v1 = Version.decodeSync('alpha')
      const v2 = Version.decodeSync('beta')

      expect(Version.order(v1, v2)).toBeLessThan(0)
      expect(Version.order(v2, v1)).toBeGreaterThan(0)
    })
  })

  describe('equivalence', () => {
    it('considers same versions equal', () => {
      const v1 = Version.decodeSync('1.0.0')
      const v2 = Version.decodeSync('1.0.0')

      expect(Version.equivalence(v1, v2)).toBe(true)
    })

    it('considers different types unequal', () => {
      const v1 = Version.decodeSync('1.0.0')
      const v2 = Version.decodeSync('2024-01-15')

      expect(Version.equivalence(v1, v2)).toBe(false)
    })

    it('considers different values of same type unequal', () => {
      const v1 = Version.decodeSync('1.0.0')
      const v2 = Version.decodeSync('2.0.0')

      expect(Version.equivalence(v1, v2)).toBe(false)
    })
  })

  describe('pattern matching', () => {
    it('matches on semver version', () => {
      const version = Version.decodeSync('1.2.3')
      const result = Version.match({
        onSemver: (v) => `Semver: ${v.value}`,
        onDate: (v) => `Date: ${v.value}`,
        onCustom: (v) => `Custom: ${v.value}`,
      })(version)

      expect(result).toBe('Semver: 1.2.3')
    })

    it('matches on date version', () => {
      const version = Version.decodeSync('2024-01-15')
      const result = Version.match({
        onSemver: (v) => `Semver: ${v.value}`,
        onDate: (v) => `Date: ${v.value}`,
        onCustom: (v) => `Custom: ${v.value}`,
      })(version)

      expect(result).toBe('Date: 2024-01-15')
    })

    it('matches on custom version', () => {
      const version = Version.decodeSync('v1.0-beta')
      const result = Version.match({
        onSemver: (v) => `Semver: ${v.value}`,
        onDate: (v) => `Date: ${v.value}`,
        onCustom: (v) => `Custom: ${v.value}`,
      })(version)

      expect(result).toBe('Custom: v1.0-beta')
    })
  })

  describe('importers', () => {
    it('creates from semver', () => {
      const semver = Semver.decodeSync('1.2.3')
      const version = Version.fromSemver(semver)

      expect(version._tag).toBe('VersionSemver')
      expect(Version.toString(version)).toBe('1.2.3')
    })

    it('creates from date', () => {
      const dateOnly = DateOnly.decodeSync('2024-01-15')
      const version = Version.fromDateOnly(dateOnly)

      expect(version._tag).toBe('VersionDate')
      expect(Version.toString(version)).toBe('2024-01-15')
    })

    it('creates from custom string', () => {
      const version = Version.fromCustom('v1.0-beta')

      expect(version._tag).toBe('VersionCustom')
      expect(Version.toString(version)).toBe('v1.0-beta')
    })
  })
})
