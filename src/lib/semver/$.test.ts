import { Effect } from 'effect'
import { describe, expect, it } from 'vitest'
import { Semver } from './$.js'

describe('decoding', () => {
  it('creates a valid semver from string', async () => {
    const version = Semver.decodeSync('1.2.3')
    expect(Semver.getMajor(version)).toBe(1)
    expect(Semver.getMinor(version)).toBe(2)
    expect(Semver.getPatch(version)).toBe(3)
  })

  it('fails on invalid semver string', async () => {
    await expect(Effect.runPromise(Semver.decode('invalid'))).rejects.toThrow()
  })
})

describe('decodeSync', () => {
  it('creates a valid semver synchronously', () => {
    const version = Semver.decodeSync('1.2.3-beta.1+build.123')
    expect(Semver.getMajor(version)).toBe(1)
    expect(Semver.getMinor(version)).toBe(2)
    expect(Semver.getPatch(version)).toBe(3)
    expect(Semver.getPrerelease(version)).toEqual(['beta', 1])
    expect(Semver.getBuild(version)).toEqual(['build', '123'])
  })
})

describe('discriminated union', () => {
  it('correctly identifies official releases', () => {
    const official = Semver.decodeSync('1.2.3')
    expect(official._tag).toBe('SemverOfficialRelease')
    expect(Semver.OfficialRelease.is(official)).toBe(true)
    expect(Semver.PreRelease.is(official)).toBe(false)
  })

  it('correctly identifies pre-releases', () => {
    const prerelease = Semver.decodeSync('1.2.3-beta')
    expect(prerelease._tag).toBe('SemverPreRelease')
    expect(Semver.PreRelease.is(prerelease)).toBe(true)
    expect(Semver.OfficialRelease.is(prerelease)).toBe(false)
  })

  it('handles build metadata on official release', () => {
    const official = Semver.decodeSync('1.2.3+build.123')
    expect(official._tag).toBe('SemverOfficialRelease')
    expect(Semver.getBuild(official)).toEqual(['build', '123'])
  })

  it('handles build metadata on pre-release', () => {
    const prerelease = Semver.decodeSync('1.2.3-beta+build.123')
    expect(prerelease._tag).toBe('SemverPreRelease')
    expect(Semver.getBuild(prerelease)).toEqual(['build', '123'])
  })
})

describe('pattern matching', () => {
  it('matches on official release', () => {
    const version = Semver.decodeSync('1.2.3')
    const result = Semver.match(
      (official) => `Official: ${official.major}.${official.minor}.${official.patch}`,
      (prerelease) =>
        `Pre-release: ${prerelease.major}.${prerelease.minor}.${prerelease.patch}-${prerelease.prerelease.join('.')}`,
    )(version)
    expect(result).toBe('Official: 1.2.3')
  })

  it('matches on pre-release', () => {
    const version = Semver.decodeSync('1.2.3-beta.1')
    const result = Semver.match(
      (official) => `Official: ${official.major}.${official.minor}.${official.patch}`,
      (prerelease) =>
        `Pre-release: ${prerelease.major}.${prerelease.minor}.${prerelease.patch}-${prerelease.prerelease.join('.')}`,
    )(version)
    expect(result).toBe('Pre-release: 1.2.3-beta.1')
  })
})

describe('comparisons', () => {
  const v1 = Semver.decodeSync('1.0.0')
  const v2 = Semver.decodeSync('2.0.0')
  const v3 = Semver.decodeSync('1.0.0')

  it('compares versions correctly', () => {
    // Use Order.compare from the order export
    expect(Semver.order(v1, v2)).toBe(-1)
    expect(Semver.order(v2, v1)).toBe(1)
    expect(Semver.order(v1, v3)).toBe(0)
  })

  it('checks greater than', () => {
    expect(Semver.greaterThan(v1)(v2)).toBe(true)
    expect(Semver.greaterThan(v2)(v1)).toBe(false)
  })

  it('checks less than', () => {
    expect(Semver.lessThan(v2)(v1)).toBe(true)
    expect(Semver.lessThan(v1)(v2)).toBe(false)
  })

  it('checks equality', () => {
    expect(Semver.equivalence(v1, v3)).toBe(true)
    expect(Semver.equivalence(v1, v2)).toBe(false)
  })
})

describe('validation', () => {
  it('validates valid semver strings', () => {
    expect(Semver.is(Semver.decodeSync('1.2.3'))).toBe(true)
    expect(Semver.is(Semver.decodeSync('0.0.0'))).toBe(true)
    expect(Semver.is(Semver.decodeSync('1.2.3-beta'))).toBe(true)
    expect(Semver.is(Semver.decodeSync('1.2.3+build'))).toBe(true)
  })

  it('validation fails for non-semver objects', () => {
    expect(Semver.is({ major: 1, minor: 2, patch: 3 })).toBe(false)
    expect(Semver.is('1.2.3')).toBe(false)
    expect(Semver.is(null)).toBe(false)
  })
})

describe('utilities', () => {
  it('increments versions', () => {
    const v = Semver.decodeSync('1.2.3')

    const major = Semver.increment(v, 'major')
    expect(major.version.toString()).toBe('2.0.0')

    const minor = Semver.increment(v, 'minor')
    expect(minor.version.toString()).toBe('1.3.0')

    const patch = Semver.increment(v, 'patch')
    expect(patch.version.toString()).toBe('1.2.4')
  })
})

describe('ordering', () => {
  it('provides correct ordering', () => {
    const versions = [
      Semver.decodeSync('2.0.0'),
      Semver.decodeSync('1.0.0'),
      Semver.decodeSync('1.5.0'),
    ]

    const sorted = [...versions].sort(Semver.order)
    expect(sorted.map(v => v.version.toString())).toEqual(['1.0.0', '1.5.0', '2.0.0'])
  })

  it('finds min and max', () => {
    const v1 = Semver.decodeSync('1.0.0')
    const v2 = Semver.decodeSync('2.0.0')

    expect(Semver.min(v1, v2)).toBe(v1)
    expect(Semver.max(v1, v2)).toBe(v2)
  })
})

describe('equivalence', () => {
  it('checks structural equality', () => {
    const v1 = Semver.decodeSync('1.0.0')
    const v2 = Semver.decodeSync('1.0.0')
    const v3 = Semver.decodeSync('2.0.0')

    expect(Semver.equivalence(v1, v2)).toBe(true)
    expect(Semver.equivalence(v1, v3)).toBe(false)
  })
})

describe('fromParts', () => {
  it('creates version from parts', () => {
    const v1 = Semver.fromParts(1, 2, 3)
    expect(v1.version.toString()).toBe('1.2.3')

    const v2 = Semver.fromParts(1, 2, 3, 'beta.1')
    expect(v2.version.toString()).toBe('1.2.3-beta.1')

    const v3 = Semver.fromParts(1, 2, 3, 'beta.1', 'build.123')
    expect(v3.version.toString()).toBe('1.2.3-beta.1+build.123')

    const v4 = Semver.fromParts(1, 2, 3, undefined, 'build.123')
    expect(v4.version.toString()).toBe('1.2.3+build.123')
  })
})

describe('satisfies', () => {
  it('checks if version satisfies range', () => {
    const v = Semver.decodeSync('1.2.3')

    expect(Semver.satisfies(v, '>=1.0.0')).toBe(true)
    expect(Semver.satisfies(v, '^1.0.0')).toBe(true)
    expect(Semver.satisfies(v, '~1.2.0')).toBe(true)
    expect(Semver.satisfies(v, '2.x')).toBe(false)
    expect(Semver.satisfies(v, 'invalid range')).toBe(false)
  })
})
