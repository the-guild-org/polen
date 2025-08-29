import { S } from '#lib/kit-temp/effect'
import { Brand } from 'effect'
import * as Path from 'node:path'

// ============================================================================
// Constants
// ============================================================================

export const SEPARATOR = '/' as const

// ============================================================================
// Schema and Type
// ============================================================================

/**
 * File path segment
 */
export type FilePathSegment = string & Brand.Brand<'FilePathSegment'>
export const FilePathSegment = S.String.pipe(
  S.brand('FilePathSegment'),
  S.annotations({
    identifier: 'FilePathSegment',
    description: 'A segment of a file path',
  }),
)

// ============================================================================
// Constructors
// ============================================================================

export const make = (path: string): FilePathSegment => path as FilePathSegment

// ============================================================================
// Type Guard
// ============================================================================

export const is = (value: unknown): value is FilePathSegment => typeof value === 'string'

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(FilePathSegment)
export const decodeSync = S.decodeSync(FilePathSegment)
export const encode = S.encode(FilePathSegment)

// ============================================================================
// Domain Logic
// ============================================================================

/**
 * Add extension to a file path
 */
export const ensureExtension = (
  path: FilePathSegment,
  extension: string,
): FilePathSegment => {
  const ext = extension.startsWith('.') ? extension : `.${extension}`
  return `${path}${ext}` as FilePathSegment
}

/**
 * Remove extension from a file path
 */
export const withoutExtension = (path: FilePathSegment): FilePathSegment => {
  const dir = Path.dirname(path)
  const base = Path.basename(path, Path.extname(path))
  return join(
    dir as FilePathSegment,
    base as FilePathSegment,
  )
}

/**
 * Get the extension from a file path
 */
export const getExtension = (path: FilePathSegment): string | undefined => {
  const ext = Path.extname(path)
  // Remove the leading dot if present
  return ext ? ext.slice(1) : undefined
}

/**
 * Get the file name from a path
 */
export const getFileName = (path: FilePathSegment): string => {
  return Path.basename(path)
}

/**
 * Get the directory from a path
 */
export const getDirectory = (path: FilePathSegment): FilePathSegment => {
  const dir = Path.dirname(path)
  // Normalize to forward slashes
  return dir.replace(/\\/g, SEPARATOR) as FilePathSegment
}

/**
 * Join multiple path segments together
 * Uses node:path internally for proper path handling
 */
export const join = (...segments: ReadonlyArray<FilePathSegment>): FilePathSegment => {
  if (segments.length === 0) {
    return '' as FilePathSegment
  }

  // Use Path.join for consistent path handling
  const joined = Path.join(...segments)

  // Normalize to forward slashes
  return joined.replace(/\\/g, SEPARATOR) as FilePathSegment
}

/**
 * Upsert extension - adds extension if missing, replaces if present
 * @param path - The file path
 * @param extension - The extension to upsert (with or without leading dot)
 */
export const upsertExtension = (
  path: FilePathSegment,
  extension: string,
): FilePathSegment => {
  const ext = extension.startsWith('.') ? extension : `.${extension}`
  const currentExt = getExtension(path)

  if (currentExt) {
    // Replace existing extension
    return ensureExtension(withoutExtension(path), extension)
  } else {
    // Add extension
    return ensureExtension(path, extension)
  }
}
