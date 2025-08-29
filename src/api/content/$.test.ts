import { S } from '#lib/kit-temp/effect'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Fs, Path } from '@wollybeard/kit'
import { Effect, Either } from 'effect'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
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

  // dprint-ignore
  Test.suite<{ input: unknown; isValid: boolean; expected?: { description?: string; hidden?: boolean } }>('MetadataSchema', [
    { name: 'validates metadata correctly',                                                              input: { description: 'Test page description', hidden: true },                                     isValid: true,  expected: { description: 'Test page description', hidden: true } },
    { name: 'applies default values',                                                                    input: { description: 'Just a description' },                                                      isValid: true,  expected: { description: 'Just a description', hidden: false } },
    { name: 'rejects invalid values',                                                                    input: { hidden: 'not a boolean', invalid_field: 123 },                                           isValid: false },
  ], ({ input, isValid, expected }) => {
    const result = S.decodeUnknownEither(Content.MetadataSchema)(input)
    
    if (isValid) {
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result) && expected) {
        expect(result.right).toEqual(expected)
      }
    } else {
      expect(Either.isLeft(result)).toBe(true)
    }
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

      const result = await Effect.runPromise(
        Content.scan({
          dir: testDir,
          glob: '**/*.md',
        }).pipe(
          Effect.provide(NodeFileSystem.layer),
        ),
      )

      expect(result.list).toHaveLength(1)
      expect(result.list[0]?.metadata).toEqual({
        description: 'Page description',
        hidden: false,
      })
      expect(result.diagnostics).toEqual([])
    })
  })
})
