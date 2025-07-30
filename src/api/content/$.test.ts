import { S } from '#lib/kit-temp/effect'
import { Fs, Path } from '@wollybeard/kit'
import { Either } from 'effect'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { Content } from './$.js'

describe('content', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = await Fs.makeTemporaryDirectory()
  })

  afterEach(async () => {
    if (testDir && await Fs.exists(testDir)) {
      await Fs.remove(testDir)
    }
  })

  describe('MetadataSchema', () => {
    test('validates metadata correctly', () => {
      const valid = S.decodeUnknownEither(Content.MetadataSchema)({
        description: 'Test page description',
        hidden: true,
      })
      expect(Either.isRight(valid)).toBe(true)
      if (Either.isRight(valid)) {
        expect(valid.right).toEqual({
          description: 'Test page description',
          hidden: true,
        })
      }
    })

    test('applies default values', () => {
      const result = S.decodeUnknownEither(Content.MetadataSchema)({
        description: 'Just a description',
      })
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right.hidden).toBe(false)
      }
    })

    test('rejects invalid values', () => {
      const result = S.decodeUnknownEither(Content.MetadataSchema)({
        hidden: 'not a boolean',
        invalid_field: 123,
      })
      expect(Either.isLeft(result)).toBe(true)
    })
  })

  describe('scan', () => {
    test('scans directory and extracts metadata', async () => {
      const filePath = Path.join(testDir, 'page.md')
      await Fs.write({
        path: filePath,
        content: `---
description: Page description
---
Content`,
      })

      const result = await Content.scan({
        dir: testDir,
        glob: '**/*.md',
      })

      expect(result.list).toHaveLength(1)
      expect(result.list[0]?.metadata).toEqual({
        description: 'Page description',
        hidden: false,
      })
      expect(result.diagnostics).toEqual([])
    })
  })
})
