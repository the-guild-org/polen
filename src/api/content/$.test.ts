import { Ei, S } from '#dep/effect'
import { Ef } from '#dep/effect'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Fs, FsLoc } from '@wollybeard/kit'
import { Test } from '@wollybeard/kit/test'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { Content } from './$.js'

let testDir: FsLoc.AbsDir.AbsDir

beforeEach(async () => {
  testDir = await Ef.runPromise(
    Ef.gen(function*() {
      return yield* Fs.makeTempDirectory()
    }).pipe(Ef.provide(NodeFileSystem.layer)),
  )
})

afterEach(async () => {
  const exists = await Ef.runPromise(
    Ef.gen(function*() {
      const result = yield* Ef.either(Fs.stat(testDir))
      return result._tag === 'Right'
    }).pipe(Ef.provide(NodeFileSystem.layer)),
  )
  if (testDir && exists) {
    await Ef.runPromise(
      Fs.remove(testDir, { recursive: true }).pipe(Ef.provide(NodeFileSystem.layer)),
    )
  }
})

type MetadataInput = { input: unknown }
type MetadataOutput = { isValid: boolean; expected?: { description?: string; hidden?: boolean } }

// dprint-ignore
Test.Table.suite<MetadataInput, MetadataOutput>('MetadataSchema', [
    { n: 'validates metadata correctly',          i: { input: { description: 'Test page description', hidden: true } },      o: { isValid: true, expected: { description: 'Test page description', hidden: true } } },
    { n: 'applies default values',                i: { input: { description: 'Just a description' } },                       o: { isValid: true, expected: { description: 'Just a description', hidden: false } } },
    { n: 'rejects invalid values',                i: { input: { hidden: 'not a boolean', invalid_field: 123 } as any },             o: { isValid: false } },
  ], ({ i, o }) => {
    const result = S.decodeUnknownEither(Content.MetadataSchema)(i.input)

    if (o.isValid) {
      expect(Ei.isRight(result)).toBe(true)
      if (Ei.isRight(result) && o.expected) {
        expect(result.right).toEqual(o.expected)
      }
    } else {
      expect(Ei.isLeft(result)).toBe(true)
    }
  })

describe('scan', () => {
  test('scans directory and extracts metadata', async () => {
    await Ef.runPromise(
      Ef.gen(function*() {
        const filePathLoc = FsLoc.join(testDir, FsLoc.RelFile.decodeSync('page.md'))
        yield* Fs.write(
          filePathLoc,
          `---
description: Page description
---
Content`,
        )
      }).pipe(Ef.provide(NodeFileSystem.layer)),
    )

    const result = await Ef.runPromise(
      Content.scan({
        dir: testDir,
        glob: '**/*.md',
      }).pipe(
        Ef.provide(NodeFileSystem.layer),
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
