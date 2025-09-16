import { Data } from 'effect'
import type { Path } from '../path.js'
import type { StepFailure } from './stepper.js'
import type { TraversalLocation } from './traversal-location.js'

/**
 * Error for failures during path traversal.
 * Contains full context about where and why traversal failed.
 */
export class TraversalError extends Data.TaggedError('TraversalError')<{
  /**
   * The original path that was being traversed.
   */
  path: Path

  /**
   * Where in the path traversal failed.
   */
  location: TraversalLocation

  /**
   * The underlying failure from the adaptor.
   */
  cause: StepFailure

  /**
   * Suggestions for what might be available (from introspection).
   */
  suggestions?: string[]
}> {}

// ============================================================================
// Legacy Helper Functions (for compatibility)
// ============================================================================

/**
 * Extract the segment name from a path node for display.
 */
export const getSegmentName = (segment: any): string => {
  switch (segment._tag) {
    case 'GraphQLPathSegmentType':
      return segment.name as string
    case 'GraphQLPathSegmentField':
      return `.${segment.name as string}`
    case 'GraphQLPathSegmentArgument':
      return `$${segment.name as string}`
    case 'GraphQLPathSegmentResolvedType':
      return '#'
    default:
      return segment.name as string ?? 'unknown'
  }
}

/**
 * Extract a display name without prefix from a segment.
 */
export const getSegmentDisplayName = (segment: any): string => {
  return segment.name as string ?? 'unknown'
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a TraversalError.
 */
export const is = (value: unknown): value is TraversalError => {
  return value instanceof TraversalError
}

// ============================================================================
// Display
// ============================================================================

/**
 * Re-export the print function for convenience.
 */
export { renderTraversalError as print } from './error-renderer.js'
