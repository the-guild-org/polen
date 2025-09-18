import { E, O } from '#dep/effect'
import { NodeFileSystem } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import { it } from '@effect/vitest'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import { describe, expect } from 'vitest'
import { buildManifest, type PolenBuildManifest } from './manifest.js'

describe('validate-build', () => {
  describe('readBuildManifest', () => {
    it.scoped('reads valid manifest', () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem
        const testDir = yield* fs.makeTempDirectoryScoped()
        const manifestPath = Path.join(testDir, '.polen', 'build.json')

        const manifest: PolenBuildManifest = {
          type: 'ssr',
          version: '2.1.0',
          basePath: '/docs/',
        }

        yield* fs.makeDirectory(Path.dirname(manifestPath), { recursive: true })
        yield* fs.writeFileString(manifestPath, JSON.stringify(manifest, null, 2))

        yield* buildManifest.read(testDir).pipe(
          Effect.flatMap(O.match({
            onNone: () => Effect.fail('Expected manifest to exist'),
            onSome: (readManifest) =>
              Effect.sync(() => {
                expect(readManifest).toEqual(manifest)
              }),
          })),
        )
      }).pipe(Effect.provide(NodeFileSystem.layer)))

    it.scoped('returns None when manifest does not exist', () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem
        const testDir = yield* fs.makeTempDirectoryScoped()
        const manifestPath = Path.join(testDir, '.polen', 'build.json')

        // Verify the file doesn't exist
        const manifestExists = yield* fs.exists(manifestPath)
        expect(manifestExists).toBe(false)

        yield* buildManifest.read(testDir).pipe(
          Effect.map((result) => {
            expect(O.isNone(result)).toBe(true)
          }),
        )
      }).pipe(Effect.provide(NodeFileSystem.layer)))

    it.scoped('returns error for invalid manifest structure', () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem
        const testDir = yield* fs.makeTempDirectoryScoped()
        const manifestPath = Path.join(testDir, '.polen', 'build.json')

        yield* fs.makeDirectory(Path.dirname(manifestPath), { recursive: true })
        yield* fs.writeFileString(manifestPath, JSON.stringify({ invalid: 'data' }, null, 2))

        const result = yield* buildManifest.read(testDir).pipe(Effect.either)
        expect(E.isLeft(result)).toBe(true)
      }).pipe(Effect.provide(NodeFileSystem.layer)))

    it.scoped('returns error for invalid build type', () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem
        const testDir = yield* fs.makeTempDirectoryScoped()
        const manifestPath = Path.join(testDir, '.polen', 'build.json')

        yield* fs.makeDirectory(Path.dirname(manifestPath), { recursive: true })
        yield* fs.writeFileString(
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

        const result = yield* buildManifest.read(testDir).pipe(Effect.either)
        expect(E.isLeft(result)).toBe(true)
      }).pipe(Effect.provide(NodeFileSystem.layer)))

    it.scoped('returns error when version is not a string', () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem
        const testDir = yield* fs.makeTempDirectoryScoped()
        const manifestPath = Path.join(testDir, '.polen', 'build.json')

        yield* fs.makeDirectory(Path.dirname(manifestPath), { recursive: true })
        yield* fs.writeFileString(
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

        const result = yield* buildManifest.read(testDir).pipe(Effect.either)
        expect(E.isLeft(result)).toBe(true)
      }).pipe(Effect.provide(NodeFileSystem.layer)))

    it.scoped('returns error when basePath is not a string', () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem
        const testDir = yield* fs.makeTempDirectoryScoped()
        const manifestPath = Path.join(testDir, '.polen', 'build.json')

        yield* fs.makeDirectory(Path.dirname(manifestPath), { recursive: true })
        yield* fs.writeFileString(
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

        const result = yield* buildManifest.read(testDir).pipe(Effect.either)
        expect(E.isLeft(result)).toBe(true)
      }).pipe(Effect.provide(NodeFileSystem.layer)))
  })
})
