import { Op } from '#dep/effect'
import { HashMap } from 'effect'
import { Version, VersionCoverage } from 'graphql-kit'
import { expect, test } from 'vitest'
import { normalizeAugmentationInput } from './input.js'

test('transforms unversioned augmentation', () => {
  const input = {
    on: 'Query',
    placement: 'before' as const,
    content: 'Test content',
  }

  const result = normalizeAugmentationInput(input)
  expect(result).not.toBeNull()

  // Should have one unversioned entry
  expect(HashMap.size(result!.versionAugmentations)).toBe(1)

  // Check the entry exists by iterating
  let foundUnversioned = false
  for (const [coverage, config] of result!.versionAugmentations) {
    if (VersionCoverage.isUnversioned(coverage)) {
      foundUnversioned = true
      expect(config.content).toBe('Test content')
      expect(config.placement).toBe('before')
    }
  }
  expect(foundUnversioned).toBe(true)
})

test('transforms versioned augmentation with defaults', () => {
  const input = {
    on: 'Pokemon',
    placement: 'after' as const,
    content: 'Default content',
    versions: {
      v1: { content: 'V1 content' },
      v2: { content: 'V2 content', placement: 'before' as const },
    },
  }

  const result = normalizeAugmentationInput(input)
  expect(result).not.toBeNull()

  // Should have two version entries (no unversioned when versions exist)
  expect(HashMap.size(result!.versionAugmentations)).toBe(2)

  // Check v1 - inherits placement from default
  const v1 = Version.decodeSync('v1')
  const v1Config = HashMap.get(
    result!.versionAugmentations,
    VersionCoverage.One.make({ version: v1 }),
  )
  expect(Op.isSome(v1Config)).toBe(true)
  if (Op.isSome(v1Config)) {
    expect(v1Config.value.content).toBe('V1 content')
    expect(v1Config.value.placement).toBe('after') // inherited
  }

  // Check v2 - overrides placement
  const v2 = Version.decodeSync('v2')
  const v2Config = HashMap.get(
    result!.versionAugmentations,
    VersionCoverage.One.make({ version: v2 }),
  )
  expect(Op.isSome(v2Config)).toBe(true)
  if (Op.isSome(v2Config)) {
    expect(v2Config.value.content).toBe('V2 content')
    expect(v2Config.value.placement).toBe('before') // overridden
  }
})

test('transforms version-only augmentation', () => {
  const input = {
    versions: {
      v2: {
        on: 'Pokemon.stats',
        content: 'V2 only content',
        placement: 'after' as const,
      },
    },
  }

  const result = normalizeAugmentationInput(input)
  expect(result).not.toBeNull()

  // Should have one version entry
  expect(HashMap.size(result!.versionAugmentations)).toBe(1)

  const v2 = Version.decodeSync('v2')
  const v2Config = HashMap.get(
    result!.versionAugmentations,
    VersionCoverage.One.make({ version: v2 }),
  )
  expect(Op.isSome(v2Config)).toBe(true)
  if (Op.isSome(v2Config)) {
    expect(v2Config.value.content).toBe('V2 only content')
    // v2Config.value.on is now a GraphQLSchemaPath
    expect(v2Config.value.on._tag).toBe('GraphQLPathRoot')
    expect(v2Config.value.on.next!._tag).toBe('GraphQLPathSegmentType')
    expect(v2Config.value.on.next!.name).toBe('Pokemon')
    expect(v2Config.value.on.next!.next?._tag).toBe('GraphQLPathSegmentField')
    expect(v2Config.value.on.next!.next?.name).toBe('stats')
  }
})

test('returns null for invalid augmentation', () => {
  const input = {
    // Missing required fields and no versions
  }

  const result = normalizeAugmentationInput(input)
  expect(result).toBeNull()
})

test('skips incomplete version entries', () => {
  const input = {
    on: 'Query',
    // Missing placement and content at top level
    versions: {
      v1: { content: 'V1 content' }, // Missing placement, can't inherit
      v2: {
        content: 'V2 content',
        placement: 'after' as const,
      }, // Complete
    },
  }

  const result = normalizeAugmentationInput(input)
  expect(result).not.toBeNull()

  // Should have only v2 (v1 is incomplete)
  expect(HashMap.size(result!.versionAugmentations)).toBe(1)

  const v2 = Version.decodeSync('v2')
  const v2Config = HashMap.get(
    result!.versionAugmentations,
    VersionCoverage.One.make({ version: v2 }),
  )
  expect(Op.isSome(v2Config)).toBe(true)
})
