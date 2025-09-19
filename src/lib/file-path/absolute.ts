import { S } from '#dep/effect'
import { ParseResult } from 'effect'
import { Segment } from './segment/$.js'
const ENCODED_PREFIX = '/'

// ============================================================================
// Schema and Type
// ============================================================================

const AbsoluteDecoded = S.TaggedStruct('FilePathAbsolute', {
  segments: S.Array(Segment.Segment),
})

const AbsoluteEncoded = S.String

export const Absolute = S.transformOrFail(
  AbsoluteEncoded,
  AbsoluteDecoded,
  {
    strict: true,
    encode: (absoluteFilePath) => {
      return ParseResult.succeed(ENCODED_PREFIX + absoluteFilePath.segments.join(Segment.SEPARATOR))
    },
    decode: (input, options, ast) => {
      if (!input.startsWith(ENCODED_PREFIX)) {
        return ParseResult.fail(
          new ParseResult.Type(ast, input, `Absolute paths must start with ${ENCODED_PREFIX}`),
        )
      }
      input = input.slice(1) // Remove leading slash for splitting
      const segments = input.split(Segment.SEPARATOR).map(s => Segment.make(s))
      return ParseResult.succeed(AbsoluteDecoded.make({
        segments,
      }))
    },
  },
)

export type Absolute = typeof Absolute.Type

// ============================================================================
// Constructors
// ============================================================================

export const make = AbsoluteDecoded.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Absolute)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Absolute)
export const decodeSync = S.decodeSync(Absolute)
export const encode = S.encode(Absolute)
export const encodeSync = S.encodeSync(Absolute)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Absolute)
