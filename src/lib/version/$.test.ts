import { describe, expect, test } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import { DateOnly } from '../date-only/$.js'
import { Semver } from '../semver/$.js'
import { Version } from './$.js'

describe('Version', () => {
  // dprint-ignore
  Test.suite<{ input: string; expectedTag: string; expectedString: string }>('decoding', [
    { name: 'decodes semver strings as SemverVersion',                                                  input: '1.2.3',                                                                                    expectedTag: 'VersionSemver',  expectedString: '1.2.3' },
    { name: 'decodes date strings as DateVersion',                                                      input: '2024-01-15',                                                                               expectedTag: 'VersionDate',    expectedString: '2024-01-15' },
    { name: 'decodes other strings as CustomVersion',                                                   input: 'v1.0-beta',                                                                                expectedTag: 'VersionCustom',  expectedString: 'v1.0-beta' },
    { name: 'prefers semver over date when ambiguous',                                                  input: '1.0.0',                                                                                    expectedTag: 'VersionSemver',  expectedString: '1.0.0' },
  ], ({ input, expectedTag, expectedString }) => {
    const version = Version.decodeSync(input)
    expect(version._tag).toBe(expectedTag)
    expect(Version.toString(version)).toBe(expectedString)
  })

  // dprint-ignore
  Test.suite<{ v1: string; v2: string; expectedComparison: 'less' | 'greater' }>('ordering', [
    { name: 'orders by type precedence: Semver > Date',                                                 v1: '1.0.0',                                                                                       v2: '2024-01-15',     expectedComparison: 'less' },
    { name: 'orders by type precedence: Date > Custom',                                                 v1: '2024-01-15',                                                                                  v2: 'custom',         expectedComparison: 'less' },
    { name: 'orders by type precedence: Semver > Custom',                                               v1: '1.0.0',                                                                                       v2: 'custom',         expectedComparison: 'less' },
    { name: 'orders within semver type (1.0.0 < 2.0.0)',                                                v1: '1.0.0',                                                                                       v2: '2.0.0',          expectedComparison: 'less' },
    { name: 'orders within semver type (2.0.0 > 1.0.0)',                                                v1: '2.0.0',                                                                                       v2: '1.0.0',          expectedComparison: 'greater' },
    { name: 'orders within date type (2024-01-15 < 2024-02-15)',                                        v1: '2024-01-15',                                                                                  v2: '2024-02-15',     expectedComparison: 'less' },
    { name: 'orders within date type (2024-02-15 > 2024-01-15)',                                        v1: '2024-02-15',                                                                                  v2: '2024-01-15',     expectedComparison: 'greater' },
    { name: 'orders within custom type (alpha < beta)',                                                 v1: 'alpha',                                                                                       v2: 'beta',           expectedComparison: 'less' },
    { name: 'orders within custom type (beta > alpha)',                                                 v1: 'beta',                                                                                        v2: 'alpha',          expectedComparison: 'greater' },
  ], ({ v1, v2, expectedComparison }) => {
    const version1 = Version.decodeSync(v1)
    const version2 = Version.decodeSync(v2)
    const result = Version.order(version1, version2)
    
    if (expectedComparison === 'less') {
      expect(result).toBeLessThan(0)
    } else {
      expect(result).toBeGreaterThan(0)
    }
  })

  // dprint-ignore
  Test.suite<{ v1: string; v2: string; expected: boolean }>('equivalence', [
    { name: 'considers same versions equal',                                                            v1: '1.0.0',                                                                                       v2: '1.0.0',          expected: true },
    { name: 'considers different types unequal',                                                        v1: '1.0.0',                                                                                       v2: '2024-01-15',     expected: false },
    { name: 'considers different values of same type unequal',                                          v1: '1.0.0',                                                                                       v2: '2.0.0',          expected: false },
  ], ({ v1, v2, expected }) => {
    const version1 = Version.decodeSync(v1)
    const version2 = Version.decodeSync(v2)
    expect(Version.equivalence(version1, version2)).toBe(expected)
  })

  // dprint-ignore
  Test.suite<{ input: string; expected: string }>('pattern matching', [
    { name: 'matches on semver version',                                                                input: '1.2.3',                                                                                    expected: 'Semver: 1.2.3' },
    { name: 'matches on date version',                                                                  input: '2024-01-15',                                                                               expected: 'Date: 2024-01-15' },
    { name: 'matches on custom version',                                                                input: 'v1.0-beta',                                                                                expected: 'Custom: v1.0-beta' },
  ], ({ input, expected }) => {
    const version = Version.decodeSync(input)
    const result = Version.match({
      onSemver: (v) => `Semver: ${v.value}`,
      onDate: (v) => `Date: ${v.value}`,
      onCustom: (v) => `Custom: ${v.value}`,
    })(version)
    expect(result).toBe(expected)
  })

  // dprint-ignore
  Test.suite<{ type: 'semver' | 'date' | 'custom'; input: string; expectedTag: string; expectedString: string }>('importers', [
    { name: 'creates from semver',         type: 'semver',  input: '1.2.3',        expectedTag: 'VersionSemver',  expectedString: '1.2.3' },
    { name: 'creates from date',           type: 'date',    input: '2024-01-15',   expectedTag: 'VersionDate',    expectedString: '2024-01-15' },
    { name: 'creates from custom string',  type: 'custom',  input: 'v1.0-beta',    expectedTag: 'VersionCustom',  expectedString: 'v1.0-beta' },
  ], ({ type, input, expectedTag, expectedString }) => {
    let version: Version.Version
    
    switch (type) {
      case 'semver': {
        const semver = Semver.decodeSync(input)
        version = Version.fromSemver(semver)
        break
      }
      case 'date': {
        const dateOnly = DateOnly.decodeSync(input)
        version = Version.fromDateOnly(dateOnly)
        break
      }
      case 'custom': {
        version = Version.fromCustom(input)
        break
      }
    }
    
    expect(version._tag).toBe(expectedTag)
    expect(Version.toString(version)).toBe(expectedString)
  })
})
