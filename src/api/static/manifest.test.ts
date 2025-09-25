import { Ei, Op } from '#dep/effect'
import { Ef } from '#dep/effect'
import { NodeFileSystem } from '@effect/platform-node'
import { it } from '@effect/vitest'
import { Fs, FsLoc } from '@wollybeard/kit'
import { describe, expect } from 'vitest'
import { buildManifest, type PolenBuildManifest } from './manifest.js'

describe('validate-build', () => {
  describe('readBuildManifest', () => {
    it.scoped('reads valid manifest', () =>
      Ef.gen(function*() {
        const testDir = yield* Fs.makeTempDirectoryScoped()
        const manifestPath = FsLoc.join(testDir, FsLoc.fromString('.polen/build.json'))

        const manifest: PolenBuildManifest = {
          type: 'ssr',
          version: '2.1.0',
          basePath: '/docs/',
        }

        yield* Fs.write(manifestPath, JSON.stringify(manifest, null, 2))

        yield* buildManifest.read(testDir).pipe(
          Ef.flatMap(Op.match({
            onNone: () => Ef.fail('Expected manifest to exist'),
            onSome: (readManifest) =>
              Ef.sync(() => {
                expect(readManifest).toEqual(manifest)
              }),
          })),
        )
      }).pipe(Ef.provide(NodeFileSystem.layer)))

    it.scoped('returns None when manifest does not exist', () =>
      Ef.gen(function*() {
        const testDir = yield* Fs.makeTempDirectoryScoped()
        const manifestPath = FsLoc.join(testDir, FsLoc.fromString('.polen/build.json'))

        // Verify the file doesn't exist
        const manifestExists = yield* Fs.exists(manifestPath)
        expect(manifestExists).toBe(false)

        yield* buildManifest.read(testDir).pipe(
          Ef.map((result) => {
            expect(Op.isNone(result)).toBe(true)
          }),
        )
      }).pipe(Ef.provide(NodeFileSystem.layer)))

    it.scoped('returns error for invalid manifest structure', () =>
      Ef.gen(function*() {
        const testDir = yield* Fs.makeTempDirectoryScoped()
        const manifestPath = FsLoc.join(testDir, FsLoc.fromString('.polen/build.json'))

        yield* Fs.write(manifestPath, JSON.stringify({ invalid: 'data' }, null, 2))

        const result = yield* buildManifest.read(testDir).pipe(Ef.either)
        expect(Ei.isLeft(result)).toBe(true)
      }).pipe(Ef.provide(NodeFileSystem.layer)))

    it.scoped('returns error for invalid build type', () =>
      Ef.gen(function*() {
        const testDir = yield* Fs.makeTempDirectoryScoped()
        const manifestPath = FsLoc.join(testDir, FsLoc.fromString('.polen/build.json'))

        yield* Fs.write(
          manifestPath,
          JSON.stringify(
            {
              type: 'invalid',
              version: '1.0.0',
              basePath: '/',
            },
            null,
            2,
          ),
        )

        const result = yield* buildManifest.read(testDir).pipe(Ef.either)
        expect(Ei.isLeft(result)).toBe(true)
      }).pipe(Ef.provide(NodeFileSystem.layer)))

    it.scoped('returns error when version is not a string', () =>
      Ef.gen(function*() {
        const testDir = yield* Fs.makeTempDirectoryScoped()
        const manifestPath = FsLoc.join(testDir, FsLoc.fromString('.polen/build.json'))

        yield* Fs.write(
          manifestPath,
          JSON.stringify(
            {
              type: 'ssg',
              version: 123,
              basePath: '/',
            },
            null,
            2,
          ),
        )

        const result = yield* buildManifest.read(testDir).pipe(Ef.either)
        expect(Ei.isLeft(result)).toBe(true)
      }).pipe(Ef.provide(NodeFileSystem.layer)))

    it.scoped('returns error when basePath is not a string', () =>
      Ef.gen(function*() {
        const testDir = yield* Fs.makeTempDirectoryScoped()
        const manifestPath = FsLoc.join(testDir, FsLoc.fromString('.polen/build.json'))

        yield* Fs.write(
          manifestPath,
          JSON.stringify(
            {
              type: 'ssg',
              version: '1.0.0',
              basePath: null,
            },
            null,
            2,
          ),
        )

        const result = yield* buildManifest.read(testDir).pipe(Ef.either)
        expect(Ei.isLeft(result)).toBe(true)
      }).pipe(Ef.provide(NodeFileSystem.layer)))
  })
})
