import { S } from '#lib/kit-temp/effect'
import { Absolute } from './absolute.js'
import { Relative } from './relative.js'

// ============================================================================
// Schema and Type
// ============================================================================

export const FilePath = S.Union(
  Absolute,
  Relative,
)
  .annotations({
    identifier: 'FilePath',
    title: 'File Path',
    description: 'A file path that can be either absolute or relative',
  })

export type FilePath = typeof FilePath.Type

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(FilePath)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(FilePath)
export const decodeSync = S.decodeSync(FilePath)
export const encode = S.encode(FilePath)
export const encodeSync = S.encodeSync(FilePath)
