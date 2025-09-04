import { S } from '#lib/kit-temp/effect'
import { ParseResult } from 'effect'
import { Segment } from './segment/$.js'

const ENCODED_PREFIX = './'

// ============================================================================
// Schema and Type
// ============================================================================

const Encoded = S.String

const Decoded = S.TaggedStruct('FilePathRelative', {
  segments: S.Array(Segment.Segment),
})

export const Relative = S.transformOrFail(
  Encoded,
  Decoded,
  {
    strict: true,
    encode: (relativeFilePath) => {
      return ParseResult.succeed(ENCODED_PREFIX + relativeFilePath.segments.join(Segment.SEPARATOR))
    },
    decode: (input, options, ast) => {
      if (input.startsWith(Segment.SEPARATOR)) {
        return ParseResult.fail(
          new ParseResult.Type(ast, input, `Relative paths must not start with a leading slash: ${input}`),
        )
      }

      // Strip ./ prefix for normalization
      let normalizedInput = input
      if (input.startsWith(ENCODED_PREFIX)) {
        normalizedInput = input.slice(2)
      }
      const segments = normalizedInput.split(Segment.SEPARATOR).filter(s => s).map(s => Segment.make(s))
      return ParseResult.succeed(Decoded.make({
        segments,
      }))
    },
  },
)

export type Relative = typeof Relative.Type

// ============================================================================
// Constructors
// ============================================================================

export const make = Decoded.make

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Relative)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Relative)
export const decodeSync = S.decodeSync(Relative)
export const encode = S.encode(Relative)
export const encodeSync = S.encodeSync(Relative)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Relative)
