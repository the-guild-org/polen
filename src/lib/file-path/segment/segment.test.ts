import { Test } from '@wollybeard/kit/test'
import { describe, expect, test } from 'vitest'
import * as FilePathSegment from './segment.js'

describe('FilePathSegment', () => {
  describe('SEPARATOR', () => {
    test('should be forward slash', () => {
      expect(FilePathSegment.SEPARATOR).toBe('/')
    })
  })
  // dprint-ignore
  Test.Table.suite<{ segments: string[]; expected: string }>('join', [
    { name: 'joins path segments',                                                                       segments: ['foo', 'bar', 'baz.txt'],                                                               expected: 'foo/bar/baz.txt' },
    { name: 'handles leading slashes',                                                                   segments: ['/foo', '/bar', '/baz.txt'],                                                            expected: '/foo/bar/baz.txt' },
    { name: 'handles trailing slashes',                                                                  segments: ['foo/', 'bar/', 'baz.txt'],                                                             expected: 'foo/bar/baz.txt' },
    { name: 'handles empty segments',                                                                    segments: ['foo', '', 'bar', '', 'baz.txt'],                                                       expected: 'foo/bar/baz.txt' },
    { name: 'returns empty for no segments',                                                             segments: [],                                                                                      expected: '' },
  ], ({ segments, expected }) => {
    const path = FilePathSegment.join(...segments.map(FilePathSegment.make))
    expect(path).toBe(expected)
  })

  // dprint-ignore
  Test.Table.suite<{ path: string; extension: string; expected: string }>('upsertExtension', [
    { name: 'adds extension when missing',                                                               path: 'file',                                                                                      extension: 'json',  expected: 'file.json' },
    { name: 'replaces existing extension',                                                               path: 'file.txt',                                                                                  extension: 'json',  expected: 'file.json' },
    { name: 'handles extension with dot',                                                                path: 'file',                                                                                      extension: '.json', expected: 'file.json' },
    { name: 'handles multiple dots in filename',                                                         path: 'file.test.txt',                                                                             extension: 'json',  expected: 'file.test.json' },
    { name: 'handles paths with directories',                                                            path: '/path/to/file.txt',                                                                         extension: 'json',  expected: '/path/to/file.json' },
  ], ({ path, extension, expected }) => {
    const result = FilePathSegment.upsertExtension(FilePathSegment.make(path), extension)
    expect(result).toBe(expected)
  })

  // dprint-ignore
  Test.Table.suite<{ path: string; extension: string; expected: string }>('withExtension', [
    { name: 'adds extension without dot',                                                                path: 'file',                                                                                      extension: 'json',  expected: 'file.json' },
    { name: 'adds extension with dot',                                                                  path: 'file',                                                                                      extension: '.json', expected: 'file.json' },
  ], ({ path, extension, expected }) => {
    const result = FilePathSegment.ensureExtension(FilePathSegment.make(path), extension)
    expect(result).toBe(expected)
  })

  // dprint-ignore
  Test.Table.suite<{ path: string; expected: string }>('withoutExtension', [
    { name: 'removes extension',                                                                         path: 'file.json',                                                                                 expected: 'file' },
    { name: 'handles no extension',                                                                      path: 'file',                                                                                      expected: 'file' },
  ], ({ path, expected }) => {
    const result = FilePathSegment.withoutExtension(FilePathSegment.make(path))
    expect(result).toBe(expected)
  })

  // dprint-ignore
  Test.Table.suite<{ path: string; expected: string | undefined }>('getExtension', [
    { name: 'gets extension',                                                                            path: 'file.json',                                                                                 expected: 'json' },
    { name: 'returns undefined for no extension',                                                        path: 'file',                                                                                      expected: undefined },
  ], ({ path, expected }) => {
    const result = FilePathSegment.getExtension(FilePathSegment.make(path))
    expect(result).toBe(expected)
  })

  // dprint-ignore
  Test.Table.suite<{ path: string; expected: string }>('getFileName', [
    { name: 'gets filename from path',                                                                   path: '/path/to/file.json',                                                                        expected: 'file.json' },
    { name: 'handles Windows paths',                                                                     path: 'C:/path/to/file.json',                                                                      expected: 'file.json' },
    { name: 'returns full path if no directory',                                                         path: 'file.json',                                                                                 expected: 'file.json' },
  ], ({ path, expected }) => {
    const result = FilePathSegment.getFileName(FilePathSegment.make(path))
    expect(result).toBe(expected)
  })

  // dprint-ignore
  Test.Table.suite<{ path: string; expected: string }>('getDirectory', [
    { name: 'gets directory from path',                                                                  path: '/path/to/file.json',                                                                        expected: '/path/to' },
    { name: 'returns dot for no directory',                                                              path: 'file.json',                                                                                 expected: '.' },
  ], ({ path, expected }) => {
    const result = FilePathSegment.getDirectory(FilePathSegment.make(path))
    expect(result).toBe(expected)
  })
})
