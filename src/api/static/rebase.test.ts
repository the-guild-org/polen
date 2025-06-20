import { Fs, Path } from '@wollybeard/kit'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { rebase, type RebasePlan } from './rebase.ts'

const testDir = 'temp/rebase-test'

const createTestBuild = async (dir: string, basePath: string = '/') => {
  await Fs.makeDirectory(dir)

  // Create Polen build manifest
  const polenDir = Path.join(dir, '.polen')
  await Fs.makeDirectory(polenDir)

  const manifest = {
    type: 'ssg' as const,
    version: '1.0.0',
    basePath,
  }

  await Fs.write({
    path: Path.join(polenDir, 'build.json'),
    content: JSON.stringify(manifest, null, 2),
  })

  // Create some HTML files
  await Fs.write({
    path: Path.join(dir, 'index.html'),
    content: `<!DOCTYPE html>
<html>
<head>
  <base href="${basePath}">
  <title>Test</title>
</head>
<body>
  <h1>Test Page</h1>
</body>
</html>`,
  })

  // Create nested HTML file
  const nestedDir = Path.join(dir, 'docs')
  await Fs.makeDirectory(nestedDir)

  await Fs.write({
    path: Path.join(nestedDir, 'page.html'),
    content: `<!DOCTYPE html>
<html>
<head>
  <title>Nested</title>
</head>
<body>
  <h1>Nested Page</h1>
</body>
</html>`,
  })
}

describe('rebase', () => {
  beforeEach(async () => {
    await Fs.remove(testDir)
  })

  afterEach(async () => {
    await Fs.remove(testDir)
  })

  test('mutate mode updates base paths in place', async () => {
    const buildDir = Path.join(testDir, 'build')
    await createTestBuild(buildDir, '/old/')

    const plan: RebasePlan = {
      sourcePath: buildDir,
      newBasePath: '/new/',
      changeMode: 'mutate',
    }

    await rebase(plan)

    // Check updated manifest
    const manifest = await Fs.readJson(Path.join(buildDir, '.polen', 'build.json'))
    expect(manifest).toMatchObject({
      type: 'ssg',
      version: '1.0.0',
      basePath: '/new/',
    })

    // Check updated HTML file
    const indexContent = await Fs.read(Path.join(buildDir, 'index.html'))
    expect(indexContent).toContain('<base href="/new/">')

    // Check nested HTML file (should have base tag inserted)
    const nestedContent = await Fs.read(Path.join(buildDir, 'docs', 'page.html'))
    expect(nestedContent).toContain('<base href="/new/">')
  })

  test('copy mode creates new build with updated base paths', async () => {
    const buildDir = Path.join(testDir, 'build')
    const copyDir = Path.join(testDir, 'copy')

    await createTestBuild(buildDir, '/old/')

    const plan: RebasePlan = {
      sourcePath: buildDir,
      targetPath: copyDir,
      newBasePath: '/new/',
      changeMode: 'copy',
    }

    await rebase(plan)

    // Original should be unchanged
    const originalManifest = await Fs.readJson(Path.join(buildDir, '.polen', 'build.json'))
    expect(originalManifest).toMatchObject({
      basePath: '/old/',
    })

    // Copy should be updated
    const copyManifest = await Fs.readJson(Path.join(copyDir, '.polen', 'build.json'))
    expect(copyManifest).toMatchObject({
      basePath: '/new/',
    })

    const copyIndexContent = await Fs.read(Path.join(copyDir, 'index.html'))
    expect(copyIndexContent).toContain('<base href="/new/">')
  })

  test('throws error for invalid base path', async () => {
    const buildDir = Path.join(testDir, 'build')
    await createTestBuild(buildDir)

    const plan: RebasePlan = {
      sourcePath: buildDir,
      newBasePath: 'invalid-path',
      changeMode: 'mutate',
    }

    await expect(rebase(plan)).rejects.toThrow('Invalid base path: invalid-path')
  })

  test('throws error when source is not a Polen build', async () => {
    const buildDir = Path.join(testDir, 'not-polen')
    await Fs.makeDirectory(buildDir)

    const plan: RebasePlan = {
      sourcePath: buildDir,
      newBasePath: '/new/',
      changeMode: 'mutate',
    }

    await expect(rebase(plan)).rejects.toThrow('Polen build manifest not found')
  })

  test('throws error when copy target exists and is not empty', async () => {
    const buildDir = Path.join(testDir, 'build')
    const copyDir = Path.join(testDir, 'copy')

    await createTestBuild(buildDir)

    // Create non-empty target
    await Fs.makeDirectory(copyDir)
    await Fs.write({
      path: Path.join(copyDir, 'existing.txt'),
      content: 'existing file',
    })

    const plan: RebasePlan = {
      sourcePath: buildDir,
      targetPath: copyDir,
      newBasePath: '/new/',
      changeMode: 'copy',
    }

    await expect(rebase(plan)).rejects.toThrow('Target path already exists and is not empty')
  })

  test('handles HTML file without existing base tag', async () => {
    const buildDir = Path.join(testDir, 'build')
    await createTestBuild(buildDir)

    // Create HTML without base tag
    await Fs.write({
      path: Path.join(buildDir, 'no-base.html'),
      content: `<!DOCTYPE html>
<html>
<head>
  <title>No Base</title>
</head>
<body>
  <h1>No Base Tag</h1>
</body>
</html>`,
    })

    const plan: RebasePlan = {
      sourcePath: buildDir,
      newBasePath: '/new/',
      changeMode: 'mutate',
    }

    await rebase(plan)

    const content = await Fs.read(Path.join(buildDir, 'no-base.html'))
    expect(content).toContain('<base href="/new/">')
  })

  test('throws error for HTML file without head tag', async () => {
    const buildDir = Path.join(testDir, 'build')
    await createTestBuild(buildDir)

    // Create invalid HTML without head
    await Fs.write({
      path: Path.join(buildDir, 'invalid.html'),
      content: `<!DOCTYPE html>
<html>
<body>
  <h1>Invalid HTML</h1>
</body>
</html>`,
    })

    const plan: RebasePlan = {
      sourcePath: buildDir,
      newBasePath: '/new/',
      changeMode: 'mutate',
    }

    await expect(rebase(plan)).rejects.toThrow('Could not find <head> tag in HTML file')
  })
})
