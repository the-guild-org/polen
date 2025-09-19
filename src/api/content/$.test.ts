import { E, S } from '#dep/effect'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@wollybeard/kit'
import { Test } from '@wollybeard/kit/test'
import { Effect } from 'effect'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { Content } from './$.js'

let testDir: string

beforeEach(async () => {
  testDir = await Effect.runPromise(
    Effect.gen(function*() {
      const fs = yield* FileSystem
      return yield* fs.makeTempDirectory()
    }).pipe(Effect.provide(NodeFileSystem.layer)),
  )
})

afterEach(async () => {
  const exists = await Effect.runPromise(
    Effect.gen(function*() {
      const fs = yield* FileSystem
      const result = yield* Effect.either(fs.stat(testDir))
      return result._tag === 'Right'
    }).pipe(Effect.provide(NodeFileSystem.layer)),
  )
  if (testDir && exists) {
    await Effect.runPromise(
      Effect.gen(function*() {
        const fs = yield* FileSystem
        yield* fs.remove(testDir, { recursive: true })
      }).pipe(Effect.provide(NodeFileSystem.layer)),
    )
  }
})

// dprint-ignore
Test.Table.suite<{ input: unknown; isValid: boolean; expected?: { description?: string; hidden?: boolean } }>('MetadataSchema', [
    { name: 'validates metadata correctly',                                                              input: { description: 'Test page description', hidden: true },                                     isValid: true,  expected: { description: 'Test page description', hidden: true } },
    { name: 'applies default values',                                                                    input: { description: 'Just a description' },                                                      isValid: true,  expected: { description: 'Just a description', hidden: false } },
    { name: 'rejects invalid values',                                                                    input: { hidden: 'not a boolean', invalid_field: 123 },                                           isValid: false },
  ], ({ input, isValid, expected }) => {
    const result = S.decodeUnknownEither(Content.MetadataSchema)(input)

    if (isValid) {
      expect(E.isRight(result)).toBe(true)
      if (E.isRight(result) && expected) {
        expect(result.right).toEqual(expected)
      }
    } else {
      expect(E.isLeft(result)).toBe(true)
    }
  })

describe('scan', () => {
  test('scans directory and extracts metadata', async () => {
    const filePath = Path.join(testDir, 'page.md')
    await Effect.runPromise(
      Effect.gen(function*() {
        const fs = yield* FileSystem
        yield* fs.writeFileString(
          filePath,
          `---
description: Page description
---
Content`,
        )
      }).pipe(Effect.provide(NodeFileSystem.layer)),
    )

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
