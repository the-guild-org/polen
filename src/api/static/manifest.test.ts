import { Err, Fs, Path } from '@wollybeard/kit'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { buildManifest, type PolenBuildManifest } from './manifest.js'

describe('validate-build', () => {
  let testDir: string
  let manifestPath: string

  beforeEach(async () => {
    testDir = await Fs.makeTemporaryDirectory()
    manifestPath = Path.join(testDir, '.polen', 'build.json')
  })

  afterEach(async () => {
    if (testDir && await Fs.exists(testDir)) {
      await Fs.remove(testDir)
    }
  })

  describe('readBuildManifest', () => {
    test('reads valid manifest', async () => {
      const manifest: PolenBuildManifest = {
        type: 'ssr',
        version: '2.1.0',
        basePath: '/docs/',
      }
      await Fs.write({
        path: manifestPath,
        content: JSON.stringify(manifest, null, 2),
      })

      const result = await buildManifest.read(testDir)
      expect(Err.is(result)).toBe(false)
      expect(result).toEqual(manifest)
    })

    test('returns error when manifest does not exist', async () => {
      // Verify the file doesn't exist
      const manifestExists = await Fs.exists(manifestPath)
      expect(manifestExists).toBe(false)

      const result = await buildManifest.read(testDir)
      expect(Err.is(result)).toBe(true)
    })

    test('returns error for invalid manifest structure', async () => {
      await Fs.write({
        path: manifestPath,
        content: JSON.stringify({ invalid: 'data' }, null, 2),
      })
      const result = await buildManifest.read(testDir)
      expect(Err.is(result)).toBe(true)
    })

    test('returns error for invalid build type', async () => {
      await Fs.write({
        path: manifestPath,
        content: JSON.stringify(
          {
            type: 'invalid',
            version: '1.0.0',
            basePath: '/',
          },
          null,
          2,
        ),
      })
      const result = await buildManifest.read(testDir)
      expect(Err.is(result)).toBe(true)
    })

    test('returns error when version is not a string', async () => {
      await Fs.write({
        path: manifestPath,
        content: JSON.stringify(
          {
            type: 'ssg',
            version: 123,
            basePath: '/',
          },
          null,
          2,
        ),
      })
      const result = await buildManifest.read(testDir)
      expect(Err.is(result)).toBe(true)
    })

    test('returns error when basePath is not a string', async () => {
      await Fs.write({
        path: manifestPath,
        content: JSON.stringify(
          {
            type: 'ssg',
            version: '1.0.0',
            basePath: null,
          },
          null,
          2,
        ),
      })
      const result = await buildManifest.read(testDir)
      expect(Err.is(result)).toBe(true)
    })
  })
})
