import { expect, test } from 'vitest'
import { FilePath } from './$.js'

test.for([
  { input: '/usr/local/bin', expected: '/usr/local/bin' },
  { input: './src/index.ts', expected: './src/index.ts' },
  { input: 'src/index.ts', expected: './src/index.ts' },
  { input: '../package.json', expected: './../package.json' },
])('encode/decode $input -> $expected', ({ input, expected }) => {
  const decoded = FilePath.decodeSync(input)
  const encoded = FilePath.encodeSync(decoded)
  expect(encoded).toBe(expected)
})

test.for([
  { path: '/usr/local/bin', isAbsolute: true },
  { path: 'src/index.ts', isAbsolute: false },
  { path: './src/index.ts', isAbsolute: false },
  { path: '../package.json', isAbsolute: false },
])('is absolute/relative $path', ({ path, isAbsolute }) => {
  const fp = FilePath.decodeSync(path)
  expect(FilePath.Absolute.is(fp)).toBe(isAbsolute)
  expect(FilePath.Relative.is(fp)).toBe(!isAbsolute)
})

test.for([
  { path: '/usr/local/bin', expectedSegments: ['usr', 'local', 'bin'] },
  { path: 'src/index.ts', expectedSegments: ['src', 'index.ts'] },
  { path: './src/index.ts', expectedSegments: ['src', 'index.ts'] },
])('segments $path', ({ path, expectedSegments }) => {
  const fp = FilePath.decodeSync(path)
  expect(fp.segments.map(s => String(s))).toEqual(expectedSegments)
})

test('absolute path construction', () => {
  const abs = FilePath.Absolute.make({ segments: ['usr', 'local', 'bin'].map(FilePath.Segment.make) })
  const encoded = FilePath.Absolute.encodeSync(abs)
  expect(encoded).toBe('/usr/local/bin')
})

test('relative path construction', () => {
  const rel = FilePath.Relative.make({ segments: ['src', 'index.ts'].map(FilePath.Segment.make) })
  const encoded = FilePath.Relative.encodeSync(rel)
  expect(encoded).toBe('./src/index.ts')
})
