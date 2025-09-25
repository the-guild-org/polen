import { Ef } from '#dep/effect'
import { FileSystem } from '@effect/platform'
import { NodeFileSystem } from '@effect/platform-node'
import { it } from '@effect/vitest'
import { Fs, FsLoc } from '@wollybeard/kit'
import { describe, expect } from 'vitest'
import {
  HtmlProcessingError,
  InvalidBasePathError,
  ManifestNotFoundError,
  rebase,
  type RebasePlan,
  TargetExistsError,
} from './rebase.js'

const createTestBuild = (dir: FsLoc.AbsDir, basePath = '/') =>
  Ef.gen(function*() {
    // Create Polen build manifest
    const polenDir = FsLoc.join(dir, '.polen/')

    const manifest = {
      type: 'ssg' as const,
      version: '1.0.0',
      basePath,
    }

    yield* Fs.write(
      FsLoc.join(polenDir, 'build.json'),
      JSON.stringify(manifest, null, 2),
    )

    // Create some HTML files
    yield* Fs.write(
      FsLoc.join(dir, 'index.html'),
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
    const nestedDir = FsLoc.join(dir, 'docs/')

    yield* Fs.write(
      FsLoc.join(nestedDir, 'page.html'),
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
    Ef.gen(function*() {
      const testDir = yield* Fs.makeTempDirectory()
      const buildDir = FsLoc.join(testDir, 'build/')
      yield* createTestBuild(buildDir, '/old/')

      const plan: RebasePlan = {
        sourcePath: buildDir,
        newBasePath: '/new/',
        changeMode: 'mutate',
      }

      yield* rebase(plan)

      // Check updated manifest
      const manifestPath = FsLoc.join(
        buildDir,
        '.polen/build.json',
      )
      const manifestContent = yield* Fs.readString(manifestPath)
      const manifest = JSON.parse(manifestContent)
      expect(manifest).toMatchObject({
        type: 'ssg',
        version: '1.0.0',
        basePath: '/new/',
      })

      // Check updated HTML file
      const indexPath = FsLoc.join(buildDir, 'index.html')
      const indexContent = yield* Fs.readString(indexPath)
      expect(indexContent).toContain('<base href="/new/">')

      // Check nested HTML file (should have base tag inserted)
      const docsDir = FsLoc.join(buildDir, 'docs/')
      const nestedPath = FsLoc.join(docsDir, 'page.html')
      const nestedContent = yield* Fs.readString(nestedPath)
      expect(nestedContent).toContain('<base href="/new/">')
    }).pipe(Ef.provide(NodeFileSystem.layer)))

  it.scoped('copy mode creates new build with updated base paths', () =>
    Ef.gen(function*() {
      const testDir = yield* Fs.makeTempDirectory()
      const buildDir = FsLoc.join(testDir, 'build/')
      const copyDir = FsLoc.join(testDir, 'copy/')

      yield* createTestBuild(buildDir, '/old/')

      const plan: RebasePlan = {
        sourcePath: buildDir,
        targetPath: copyDir,
        newBasePath: '/new/',
        changeMode: 'copy',
      }

      yield* rebase(plan)

      // Original should be unchanged
      const polenDir = FsLoc.join(buildDir, '.polen/')
      const originalManifestPath = FsLoc.join(polenDir, 'build.json')
      const originalManifestContent = yield* Fs.readString(originalManifestPath)
      const originalManifest = JSON.parse(originalManifestContent)
      expect(originalManifest).toMatchObject({
        basePath: '/old/',
      })

      // Copy should be updated
      const copyManifestPath = FsLoc.join(
        copyDir,
        '.polen/build.json',
      )
      const copyManifestContent = yield* Fs.readString(copyManifestPath)
      const copyManifest = JSON.parse(copyManifestContent)
      expect(copyManifest).toMatchObject({
        basePath: '/new/',
      })

      const copyIndexPath = FsLoc.join(copyDir, 'index.html')
      const copyIndexContent = yield* Fs.readString(copyIndexPath)
      expect(copyIndexContent).toContain('<base href="/new/">')
    }).pipe(Ef.provide(NodeFileSystem.layer)))

  it.scoped('throws error for invalid base path', () =>
    Ef.gen(function*() {
      const testDir = yield* Fs.makeTempDirectory()
      const buildDir = FsLoc.join(testDir, 'build/')
      yield* createTestBuild(buildDir)

      const plan: RebasePlan = {
        sourcePath: buildDir,
        newBasePath: 'invalid-path',
        changeMode: 'mutate',
      }

      yield* rebase(plan).pipe(
        Ef.flip,
        Ef.map((error) => {
          expect(error).toBeInstanceOf(InvalidBasePathError)
          expect((error as InvalidBasePathError).path).toBe('invalid-path')
        }),
      )
    }).pipe(Ef.provide(NodeFileSystem.layer)))

  it.scoped('throws error when source is not a Polen build', () =>
    Ef.gen(function*() {
      const testDir = yield* Fs.makeTempDirectoryScoped()
      const buildDir = FsLoc.join(testDir, 'not-polen/')

      const plan: RebasePlan = {
        sourcePath: buildDir,
        newBasePath: '/new/',
        changeMode: 'mutate',
      }

      yield* rebase(plan).pipe(
        Ef.flip,
        Ef.map((error) => {
          expect(error).toBeInstanceOf(ManifestNotFoundError)
          expect((error as ManifestNotFoundError).path).toBe(FsLoc.encodeSync(buildDir))
        }),
      )
    }).pipe(Ef.provide(NodeFileSystem.layer)))

  it.scoped('throws error when copy target exists and is not empty', () =>
    Ef.gen(function*() {
      const testDir = yield* Fs.makeTempDirectoryScoped()
      const buildDir = FsLoc.join(testDir, 'build/')
      const copyDir = FsLoc.join(testDir, 'copy/')

      yield* createTestBuild(buildDir)

      // Create non-empty target
      yield* Fs.write(
        FsLoc.join(copyDir, 'existing.txt'),
        'existing file',
      )

      const plan: RebasePlan = {
        sourcePath: buildDir,
        targetPath: copyDir,
        newBasePath: '/new/',
        changeMode: 'copy',
      }

      yield* rebase(plan).pipe(
        Ef.flip,
        Ef.map((error) => {
          expect(error).toBeInstanceOf(TargetExistsError)
          expect((error as TargetExistsError).path).toBe(FsLoc.encodeSync(copyDir))
        }),
      )
    }).pipe(Ef.provide(NodeFileSystem.layer)))

  it.scoped('handles HTML file without existing base tag', () =>
    Ef.gen(function*() {
      const testDir = yield* Fs.makeTempDirectory()
      const buildDir = FsLoc.join(testDir, 'build/')
      yield* createTestBuild(buildDir)

      // Create HTML without base tag
      yield* Fs.write(
        FsLoc.join(buildDir, 'no-base.html'),
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

      const noBasePath = FsLoc.join(buildDir, 'no-base.html')
      const content = yield* Fs.readString(noBasePath)
      expect(content).toContain('<base href="/new/">')
    }).pipe(Ef.provide(NodeFileSystem.layer)))

  it.scoped('throws error for HTML file without head tag', () =>
    Ef.gen(function*() {
      const testDir = yield* Fs.makeTempDirectory()
      const buildDir = FsLoc.join(testDir, 'build/')
      yield* createTestBuild(buildDir)

      // Create invalid HTML without head
      yield* Fs.write(
        FsLoc.join(buildDir, 'invalid.html'),
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
        Ef.flip,
        Ef.map((error) => {
          expect(error).toBeInstanceOf(HtmlProcessingError)
          expect((error as HtmlProcessingError).reason).toContain('Could not find <head> tag in HTML file')
        }),
      )
    }).pipe(Ef.provide(NodeFileSystem.layer)))
})
