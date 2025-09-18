import { NodeFileSystem } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import { it } from '@effect/vitest'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import { describe, expect } from 'vitest'
import {
  HtmlProcessingError,
  InvalidBasePathError,
  ManifestNotFoundError,
  rebase,
  type RebasePlan,
  TargetExistsError,
} from './rebase.js'

const createTestBuild = (dir: string, basePath = '/') =>
  Effect.gen(function*() {
    const fs = yield* FileSystem
    yield* fs.makeDirectory(dir, { recursive: true })

    // Create Polen build manifest
    const polenDir = Path.join(dir, '.polen')
    yield* fs.makeDirectory(polenDir, { recursive: true })

    const manifest = {
      type: 'ssg' as const,
      version: '1.0.0',
      basePath,
    }

    yield* fs.writeFileString(
      Path.join(polenDir, 'build.json'),
      JSON.stringify(manifest, null, 2),
    )

    // Create some HTML files
    yield* fs.writeFileString(
      Path.join(dir, 'index.html'),
      `<!DOCTYPE html>
<html>
<head>
  <base href="${basePath}">
  <title>Test</title>
</head>
<body>
  <h1>Test Page</h1>
</body>
</html>`,
    )

    // Create nested HTML file
    const nestedDir = Path.join(dir, 'docs')
    yield* fs.makeDirectory(nestedDir, { recursive: true })

    yield* fs.writeFileString(
      Path.join(nestedDir, 'page.html'),
      `<!DOCTYPE html>
<html>
<head>
  <title>Nested</title>
</head>
<body>
  <h1>Nested Page</h1>
</body>
</html>`,
    )
  })

describe('rebase', () => {
  it.scoped('mutate mode updates base paths in place', () =>
    Effect.gen(function*() {
      const fs = yield* FileSystem
      const testDir = yield* fs.makeTempDirectoryScoped()
      const buildDir = Path.join(testDir, 'build')
      yield* createTestBuild(buildDir, '/old/')

      const plan: RebasePlan = {
        sourcePath: buildDir,
        newBasePath: '/new/',
        changeMode: 'mutate',
      }

      yield* rebase(plan)

      // Check updated manifest
      const manifestContent = yield* fs.readFileString(Path.join(buildDir, '.polen', 'build.json'))
      const manifest = JSON.parse(manifestContent)
      expect(manifest).toMatchObject({
        type: 'ssg',
        version: '1.0.0',
        basePath: '/new/',
      })

      // Check updated HTML file
      const indexContent = yield* fs.readFileString(Path.join(buildDir, 'index.html'))
      expect(indexContent).toContain('<base href="/new/">')

      // Check nested HTML file (should have base tag inserted)
      const nestedContent = yield* fs.readFileString(Path.join(buildDir, 'docs', 'page.html'))
      expect(nestedContent).toContain('<base href="/new/">')
    }).pipe(Effect.provide(NodeFileSystem.layer)))

  it.scoped('copy mode creates new build with updated base paths', () =>
    Effect.gen(function*() {
      const fs = yield* FileSystem
      const testDir = yield* fs.makeTempDirectoryScoped()
      const buildDir = Path.join(testDir, 'build')
      const copyDir = Path.join(testDir, 'copy')

      yield* createTestBuild(buildDir, '/old/')

      const plan: RebasePlan = {
        sourcePath: buildDir,
        targetPath: copyDir,
        newBasePath: '/new/',
        changeMode: 'copy',
      }

      yield* rebase(plan)

      // Original should be unchanged
      const originalManifestContent = yield* fs.readFileString(Path.join(buildDir, '.polen', 'build.json'))
      const originalManifest = JSON.parse(originalManifestContent)
      expect(originalManifest).toMatchObject({
        basePath: '/old/',
      })

      // Copy should be updated
      const copyManifestContent = yield* fs.readFileString(Path.join(copyDir, '.polen', 'build.json'))
      const copyManifest = JSON.parse(copyManifestContent)
      expect(copyManifest).toMatchObject({
        basePath: '/new/',
      })

      const copyIndexContent = yield* fs.readFileString(Path.join(copyDir, 'index.html'))
      expect(copyIndexContent).toContain('<base href="/new/">')
    }).pipe(Effect.provide(NodeFileSystem.layer)))

  it.scoped('throws error for invalid base path', () =>
    Effect.gen(function*() {
      const fs = yield* FileSystem
      const testDir = yield* fs.makeTempDirectoryScoped()
      const buildDir = Path.join(testDir, 'build')
      yield* createTestBuild(buildDir)

      const plan: RebasePlan = {
        sourcePath: buildDir,
        newBasePath: 'invalid-path',
        changeMode: 'mutate',
      }

      yield* rebase(plan).pipe(
        Effect.flip,
        Effect.map((error) => {
          expect(error).toBeInstanceOf(InvalidBasePathError)
          expect((error as InvalidBasePathError).path).toBe('invalid-path')
        }),
      )
    }).pipe(Effect.provide(NodeFileSystem.layer)))

  it.scoped('throws error when source is not a Polen build', () =>
    Effect.gen(function*() {
      const fs = yield* FileSystem
      const testDir = yield* fs.makeTempDirectoryScoped()
      const buildDir = Path.join(testDir, 'not-polen')
      yield* fs.makeDirectory(buildDir, { recursive: true })

      const plan: RebasePlan = {
        sourcePath: buildDir,
        newBasePath: '/new/',
        changeMode: 'mutate',
      }

      yield* rebase(plan).pipe(
        Effect.flip,
        Effect.map((error) => {
          expect(error).toBeInstanceOf(ManifestNotFoundError)
          expect((error as ManifestNotFoundError).path).toBe(buildDir)
        }),
      )
    }).pipe(Effect.provide(NodeFileSystem.layer)))

  it.scoped('throws error when copy target exists and is not empty', () =>
    Effect.gen(function*() {
      const fs = yield* FileSystem
      const testDir = yield* fs.makeTempDirectoryScoped()
      const buildDir = Path.join(testDir, 'build')
      const copyDir = Path.join(testDir, 'copy')

      yield* createTestBuild(buildDir)

      // Create non-empty target
      yield* fs.makeDirectory(copyDir, { recursive: true })
      yield* fs.writeFileString(
        Path.join(copyDir, 'existing.txt'),
        'existing file',
      )

      const plan: RebasePlan = {
        sourcePath: buildDir,
        targetPath: copyDir,
        newBasePath: '/new/',
        changeMode: 'copy',
      }

      yield* rebase(plan).pipe(
        Effect.flip,
        Effect.map((error) => {
          expect(error).toBeInstanceOf(TargetExistsError)
          expect((error as TargetExistsError).path).toBe(copyDir)
        }),
      )
    }).pipe(Effect.provide(NodeFileSystem.layer)))

  it.scoped('handles HTML file without existing base tag', () =>
    Effect.gen(function*() {
      const fs = yield* FileSystem
      const testDir = yield* fs.makeTempDirectoryScoped()
      const buildDir = Path.join(testDir, 'build')
      yield* createTestBuild(buildDir)

      // Create HTML without base tag
      yield* fs.writeFileString(
        Path.join(buildDir, 'no-base.html'),
        `<!DOCTYPE html>
<html>
<head>
  <title>No Base</title>
</head>
<body>
  <h1>No Base Tag</h1>
</body>
</html>`,
      )

      const plan: RebasePlan = {
        sourcePath: buildDir,
        newBasePath: '/new/',
        changeMode: 'mutate',
      }

      yield* rebase(plan)

      const content = yield* fs.readFileString(Path.join(buildDir, 'no-base.html'))
      expect(content).toContain('<base href="/new/">')
    }).pipe(Effect.provide(NodeFileSystem.layer)))

  it.scoped('throws error for HTML file without head tag', () =>
    Effect.gen(function*() {
      const fs = yield* FileSystem
      const testDir = yield* fs.makeTempDirectoryScoped()
      const buildDir = Path.join(testDir, 'build')
      yield* createTestBuild(buildDir)

      // Create invalid HTML without head
      yield* fs.writeFileString(
        Path.join(buildDir, 'invalid.html'),
        `<!DOCTYPE html>
<html>
<body>
  <h1>Invalid HTML</h1>
</body>
</html>`,
      )

      const plan: RebasePlan = {
        sourcePath: buildDir,
        newBasePath: '/new/',
        changeMode: 'mutate',
      }

      yield* rebase(plan).pipe(
        Effect.flip,
        Effect.map((error) => {
          expect(error).toBeInstanceOf(HtmlProcessingError)
          expect((error as HtmlProcessingError).reason).toContain('Could not find <head> tag in HTML file')
        }),
      )
    }).pipe(Effect.provide(NodeFileSystem.layer)))
})
