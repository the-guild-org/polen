import { Data } from 'effect'

/**
 * Error for failures during path string parsing.
 * Occurs before traversal when converting string to AST.
 */
export class ParseError extends Data.TaggedError('ParseError')<{
  /**
   * The input string that failed to parse.
   */
  input: string

  /**
   * Character position where parsing failed.
   */
  position: number

  /**
   * Human-readable error message.
   */
  message: string
}> {}
