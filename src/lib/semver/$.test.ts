import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import { Semver } from './$.js'

// dprint-ignore
Test.suite<{ input: string; sync: boolean; shouldSucceed: boolean; major?: number; minor?: number; patch?: number; prerelease?: (string | number)[]; build?: string[] }>('decoding', [
  { name: 'creates a valid semver from string',         input: '1.2.3',                    sync: false, shouldSucceed: true,  major: 1, minor: 2, patch: 3 },
  { name: 'fails on invalid semver string',             input: 'invalid',                  sync: false, shouldSucceed: false },
  { name: 'creates a valid semver synchronously',       input: '1.2.3-beta.1+build.123',   sync: true,  shouldSucceed: true,  major: 1, minor: 2, patch: 3, prerelease: ['beta', 1], build: ['build', '123'] },
], async ({ input, sync, shouldSucceed, major, minor, patch, prerelease, build }) => {
  if (sync) {
    const version = Semver.decodeSync(input)
    expect(Semver.getMajor(version)).toBe(major)
    expect(Semver.getMinor(version)).toBe(minor)
    expect(Semver.getPatch(version)).toBe(patch)
    if (prerelease) {
      expect(Semver.getPrerelease(version)).toEqual(prerelease)
    }
    if (build) {
      expect(Semver.getBuild(version)).toEqual(build)
    }
  } else {
    if (shouldSucceed) {
      const version = Semver.decodeSync(input)
      expect(Semver.getMajor(version)).toBe(major)
      expect(Semver.getMinor(version)).toBe(minor)
      expect(Semver.getPatch(version)).toBe(patch)
    } else {
      await expect(Effect.runPromise(Semver.decode(input))).rejects.toThrow()
    }
  }
})

// dprint-ignore
Test.suite<{ version: string; expectedTag: string; isOfficial: boolean; isPreRelease: boolean; build?: string[] }>('discriminated union', [
  { name: 'correctly identifies official releases',                                                    version: '1.2.3',                                                                                  expectedTag: 'SemverOfficialRelease', isOfficial: true,  isPreRelease: false },
  { name: 'correctly identifies pre-releases',                                                         version: '1.2.3-beta',                                                                             expectedTag: 'SemverPreRelease',      isOfficial: false, isPreRelease: true },
  { name: 'handles build metadata on official release',                                                version: '1.2.3+build.123',                                                                        expectedTag: 'SemverOfficialRelease', isOfficial: true,  isPreRelease: false, build: ['build', '123'] },
  { name: 'handles build metadata on pre-release',                                                     version: '1.2.3-beta+build.123',                                                                   expectedTag: 'SemverPreRelease',      isOfficial: false, isPreRelease: true,  build: ['build', '123'] },
], ({ version, expectedTag, isOfficial, isPreRelease, build }) => {
  const semver = Semver.decodeSync(version)
  expect(semver._tag).toBe(expectedTag)
  expect(Semver.OfficialRelease.is(semver)).toBe(isOfficial)
  expect(Semver.PreRelease.is(semver)).toBe(isPreRelease)
  if (build) {
    expect(Semver.getBuild(semver)).toEqual(build)
  }
})

// dprint-ignore
Test.suite<{ version: string; expected: string }>('pattern matching', [
  { name: 'matches on official release',                                                               version: '1.2.3',                                                                                  expected: 'Official: 1.2.3' },
  { name: 'matches on pre-release',                                                                    version: '1.2.3-beta.1',                                                                           expected: 'Pre-release: 1.2.3-beta.1' },
], ({ version, expected }) => {
  const semver = Semver.decodeSync(version)
  const result = Semver.match(
    (official) => `Official: ${official.major}.${official.minor}.${official.patch}`,
    (prerelease) =>
      `Pre-release: ${prerelease.major}.${prerelease.minor}.${prerelease.patch}-${prerelease.prerelease.join('.')}`,
  )(semver)
  expect(result).toBe(expected)
})

// dprint-ignore
Test.suite<{ method: 'order' | 'greaterThan' | 'lessThan' | 'equivalence'; v1: string; v2: string; expected: number | boolean }>('comparisons', [
  { name: 'compares versions correctly (v1 < v2)',      method: 'order',        v1: '1.0.0', v2: '2.0.0', expected: -1 },
  { name: 'compares versions correctly (v1 > v2)',      method: 'order',        v1: '2.0.0', v2: '1.0.0', expected: 1 },
  { name: 'compares versions correctly (v1 = v2)',      method: 'order',        v1: '1.0.0', v2: '1.0.0', expected: 0 },
  { name: 'checks greater than (v1 < v2)',              method: 'greaterThan',  v1: '1.0.0', v2: '2.0.0', expected: true },
  { name: 'checks greater than (v1 > v2)',              method: 'greaterThan',  v1: '2.0.0', v2: '1.0.0', expected: false },
  { name: 'checks less than (v1 < v2)',                 method: 'lessThan',     v1: '2.0.0', v2: '1.0.0', expected: true },
  { name: 'checks less than (v1 > v2)',                 method: 'lessThan',     v1: '1.0.0', v2: '2.0.0', expected: false },
  { name: 'checks equality (equal)',                    method: 'equivalence',  v1: '1.0.0', v2: '1.0.0', expected: true },
  { name: 'checks equality (not equal)',                method: 'equivalence',  v1: '1.0.0', v2: '2.0.0', expected: false },
], ({ method, v1, v2, expected }) => {
  const version1 = Semver.decodeSync(v1)
  const version2 = Semver.decodeSync(v2)
  
  switch (method) {
    case 'order':
      expect(Semver.order(version1, version2)).toBe(expected)
      break
    case 'greaterThan':
      expect(Semver.greaterThan(version1)(version2)).toBe(expected)
      break
    case 'lessThan':
      expect(Semver.lessThan(version1)(version2)).toBe(expected)
      break
    case 'equivalence':
      expect(Semver.equivalence(version1, version2)).toBe(expected)
      break
  }
})

// dprint-ignore
Test.suite<{ value: unknown; expected: boolean }>('validation', [
  { name: 'validates 1.2.3',                                                                           value: Semver.decodeSync('1.2.3'),                                                                expected: true },
  { name: 'validates 0.0.0',                                                                           value: Semver.decodeSync('0.0.0'),                                                                expected: true },
  { name: 'validates 1.2.3-beta',                                                                      value: Semver.decodeSync('1.2.3-beta'),                                                           expected: true },
  { name: 'validates 1.2.3+build',                                                                     value: Semver.decodeSync('1.2.3+build'),                                                          expected: true },
  { name: 'rejects plain object',                                                                      value: { major: 1, minor: 2, patch: 3 },                                                          expected: false },
  { name: 'rejects string',                                                                            value: '1.2.3',                                                                                    expected: false },
  { name: 'rejects null',                                                                              value: null,                                                                                       expected: false },
], ({ value, expected }) => {
  expect(Semver.is(value)).toBe(expected)
})

// dprint-ignore
Test.suite<{ level: 'major' | 'minor' | 'patch'; expected: string }>('utilities', [
  { name: 'increments major version',                                                                  level: 'major',                                                                                    expected: '2.0.0' },
  { name: 'increments minor version',                                                                  level: 'minor',                                                                                    expected: '1.3.0' },
  { name: 'increments patch version',                                                                  level: 'patch',                                                                                    expected: '1.2.4' },
], ({ level, expected }) => {
  const v = Semver.decodeSync('1.2.3')
  const incremented = Semver.increment(v, level)
  expect(incremented.version.toString()).toBe(expected)
})

// dprint-ignore
Test.suite<{ test: 'sort' | 'min' | 'max' | 'equivalence'; versions?: string[]; v1?: string; v2?: string; expected: string[] | string | boolean }>('ordering and equivalence', [
  { name: 'provides correct ordering',                   test: 'sort',        versions: ['2.0.0', '1.0.0', '1.5.0'],         expected: ['1.0.0', '1.5.0', '2.0.0'] },
  { name: 'finds min',                                   test: 'min',         v1: '1.0.0', v2: '2.0.0',                      expected: '1.0.0' },
  { name: 'finds max',                                   test: 'max',         v1: '1.0.0', v2: '2.0.0',                      expected: '2.0.0' },
  { name: 'checks structural equality (equal)',          test: 'equivalence', v1: '1.0.0', v2: '1.0.0',                      expected: true },
  { name: 'checks structural equality (not equal)',      test: 'equivalence', v1: '1.0.0', v2: '2.0.0',                      expected: false },
], ({ test, versions, v1, v2, expected }) => {
  switch (test) {
    case 'sort': {
      const versionObjs = versions!.map(v => Semver.decodeSync(v))
      const sorted = [...versionObjs].sort(Semver.order)
      expect(sorted.map(v => v.version.toString())).toEqual(expected)
      break
    }
    case 'min': {
      const version1 = Semver.decodeSync(v1!)
      const version2 = Semver.decodeSync(v2!)
      const result = Semver.min(version1, version2)
      expect(result.version.toString()).toBe(expected)
      break
    }
    case 'max': {
      const version1 = Semver.decodeSync(v1!)
      const version2 = Semver.decodeSync(v2!)
      const result = Semver.max(version1, version2)
      expect(result.version.toString()).toBe(expected)
      break
    }
    case 'equivalence': {
      const version1 = Semver.decodeSync(v1!)
      const version2 = Semver.decodeSync(v2!)
      expect(Semver.equivalence(version1, version2)).toBe(expected)
      break
    }
  }
})

// dprint-ignore
Test.suite<{ major: number; minor: number; patch: number; prerelease?: string | undefined; build?: string | undefined; expected: string | undefined }>('fromParts', [
  { name: 'creates version from basic parts',                                                          major: 1, minor: 2, patch: 3,                                                                      expected: '1.2.3' },
  { name: 'creates version with prerelease',                                                           major: 1, minor: 2, patch: 3, prerelease: 'beta.1',                                               expected: '1.2.3-beta.1' },
  { name: 'creates version with prerelease and build',                                                 major: 1, minor: 2, patch: 3, prerelease: 'beta.1', build: 'build.123',                           expected: '1.2.3-beta.1+build.123' },
  { name: 'creates version with build only',                                                           major: 1, minor: 2, patch: 3, prerelease: undefined, build: 'build.123',                          expected: '1.2.3+build.123' },
], ({ major, minor, patch, prerelease, build, expected }) => {
  const version = Semver.fromParts(major, minor, patch, prerelease, build)
  expect(version.version.toString()).toBe(expected)
})

// dprint-ignore
Test.suite<{ range: string; expected: boolean }>('satisfies', [
  { name: 'satisfies >=1.0.0',                                                                         range: '>=1.0.0',                                                                                  expected: true },
  { name: 'satisfies ^1.0.0',                                                                          range: '^1.0.0',                                                                                   expected: true },
  { name: 'satisfies ~1.2.0',                                                                          range: '~1.2.0',                                                                                   expected: true },
  { name: 'does not satisfy 2.x',                                                                      range: '2.x',                                                                                      expected: false },
  { name: 'invalid range returns false',                                                               range: 'invalid range',                                                                            expected: false },
], ({ range, expected }) => {
  const v = Semver.decodeSync('1.2.3')
  expect(Semver.satisfies(v, range)).toBe(expected)
})
