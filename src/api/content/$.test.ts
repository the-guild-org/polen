import { Fs, Path } from '@wollybeard/kit'
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
      const valid = Content.MetadataSchema.safeParse({
        description: 'Test page description',
        hidden: true,
      })
      expect(valid.success).toBe(true)
      expect(valid.data).toEqual({
        description: 'Test page description',
        hidden: true,
      })
    })

    test('applies default values', () => {
      const result = Content.MetadataSchema.safeParse({
        description: 'Just a description',
      })
      expect(result.success).toBe(true)
      expect(result.data?.hidden).toBe(false)
    })

    test('rejects invalid values', () => {
      const result = Content.MetadataSchema.safeParse({
        hidden: 'not a boolean',
        invalid_field: 123,
      })
      expect(result.success).toBe(false)
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
