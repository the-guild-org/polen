import { describe, expect, it } from 'vitest'
import * as FilePathSegment from './$$.js'

describe('FilePathSegment', () => {
  describe('SEPARATOR', () => {
    it('should be forward slash', () => {
      expect(FilePathSegment.SEPARATOR).toBe('/')
    })
  })
  describe('join', () => {
    it('should join path segments', () => {
      const path = FilePathSegment.join(
        FilePathSegment.make('foo'),
        FilePathSegment.make('bar'),
        FilePathSegment.make('baz.txt'),
      )
      expect(path).toBe('foo/bar/baz.txt')
    })

    it('should handle leading slashes', () => {
      const path = FilePathSegment.join(
        FilePathSegment.make('/foo'),
        FilePathSegment.make('/bar'),
        FilePathSegment.make('/baz.txt'),
      )
      expect(path).toBe('/foo/bar/baz.txt')
    })

    it('should handle trailing slashes', () => {
      const path = FilePathSegment.join(
        FilePathSegment.make('foo/'),
        FilePathSegment.make('bar/'),
        FilePathSegment.make('baz.txt'),
      )
      expect(path).toBe('foo/bar/baz.txt')
    })

    it('should handle empty segments', () => {
      const path = FilePathSegment.join(
        FilePathSegment.make('foo'),
        FilePathSegment.make(''),
        FilePathSegment.make('bar'),
        FilePathSegment.make(''),
        FilePathSegment.make('baz.txt'),
      )
      expect(path).toBe('foo/bar/baz.txt')
    })

    it('should return empty for no segments', () => {
      const path = FilePathSegment.join()
      expect(path).toBe('')
    })
  })

  describe('upsertExtension', () => {
    it('should add extension when missing', () => {
      const path = FilePathSegment.make('file')
      const result = FilePathSegment.upsertExtension(path, 'json')
      expect(result).toBe('file.json')
    })

    it('should replace existing extension', () => {
      const path = FilePathSegment.make('file.txt')
      const result = FilePathSegment.upsertExtension(path, 'json')
      expect(result).toBe('file.json')
    })

    it('should handle extension with dot', () => {
      const path = FilePathSegment.make('file')
      const result = FilePathSegment.upsertExtension(path, '.json')
      expect(result).toBe('file.json')
    })

    it('should handle multiple dots in filename', () => {
      const path = FilePathSegment.make('file.test.txt')
      const result = FilePathSegment.upsertExtension(path, 'json')
      expect(result).toBe('file.test.json')
    })

    it('should handle paths with directories', () => {
      const path = FilePathSegment.make('/path/to/file.txt')
      const result = FilePathSegment.upsertExtension(path, 'json')
      expect(result).toBe('/path/to/file.json')
    })
  })

  describe('withExtension', () => {
    it('should add extension without dot', () => {
      const path = FilePathSegment.make('file')
      const result = FilePathSegment.ensureExtension(path, 'json')
      expect(result).toBe('file.json')
    })

    it('should add extension with dot', () => {
      const path = FilePathSegment.make('file')
      const result = FilePathSegment.ensureExtension(path, '.json')
      expect(result).toBe('file.json')
    })
  })

  describe('withoutExtension', () => {
    it('should remove extension', () => {
      const path = FilePathSegment.make('file.json')
      const result = FilePathSegment.withoutExtension(path)
      expect(result).toBe('file')
    })

    it('should handle no extension', () => {
      const path = FilePathSegment.make('file')
      const result = FilePathSegment.withoutExtension(path)
      expect(result).toBe('file')
    })
  })

  describe('getExtension', () => {
    it('should get extension', () => {
      const path = FilePathSegment.make('file.json')
      const result = FilePathSegment.getExtension(path)
      expect(result).toBe('json')
    })

    it('should return undefined for no extension', () => {
      const path = FilePathSegment.make('file')
      const result = FilePathSegment.getExtension(path)
      expect(result).toBeUndefined()
    })
  })

  describe('getFileName', () => {
    it('should get filename from path', () => {
      const path = FilePathSegment.make('/path/to/file.json')
      const result = FilePathSegment.getFileName(path)
      expect(result).toBe('file.json')
    })

    it('should handle Windows paths', () => {
      const path = FilePathSegment.make('C:/path/to/file.json')
      const result = FilePathSegment.getFileName(path)
      expect(result).toBe('file.json')
    })

    it('should return full path if no directory', () => {
      const path = FilePathSegment.make('file.json')
      const result = FilePathSegment.getFileName(path)
      expect(result).toBe('file.json')
    })
  })

  describe('getDirectory', () => {
    it('should get directory from path', () => {
      const path = FilePathSegment.make('/path/to/file.json')
      const result = FilePathSegment.getDirectory(path)
      expect(result).toBe('/path/to')
    })

    it('should return dot for no directory', () => {
      const path = FilePathSegment.make('file.json')
      const result = FilePathSegment.getDirectory(path)
      expect(result).toBe('.')
    })
  })
})
