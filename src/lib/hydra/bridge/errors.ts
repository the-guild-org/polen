import { Data } from 'effect'

// ============================================================================
// Base Error
// ============================================================================

/**
 * Base error class for all Bridge-related errors
 */
export class BridgeError extends Data.TaggedError('BridgeError') {
  readonly details: unknown
}

// ============================================================================
// Specific Errors
// ============================================================================

/**
 * Error thrown when an asset is not found during peek/view operations
 */
export class AssetNotFoundError extends Data.TaggedError('AssetNotFoundError')<{
  readonly path: string
  readonly cause?: unknown
}> {}

/**
 * Error thrown when loaded schema doesn't match expected version
 */
export class SchemaVersionError extends Data.TaggedError('SchemaVersionError')<{
  readonly expected: unknown
  readonly actual: unknown
  readonly cause?: unknown
}> {}

/**
 * Error thrown when a selection is invalid
 */
export class InvalidSelectionError extends Data.TaggedError('InvalidSelectionError')<{
  readonly selection: unknown
  readonly reason: string
  readonly cause?: unknown
}> {}

/**
 * Error thrown when a type appears in multiple paths in the schema graph
 */
export class MultiplePathsError extends Data.TaggedError('MultiplePathsError')<{
  readonly type: string
  readonly paths: string[][]
  readonly cause?: unknown
}> {}

/**
 * Error thrown during IO operations
 */
export class IOError extends Data.TaggedError('IOError')<{
  readonly operation: 'read' | 'write' | 'list' | 'remove'
  readonly path: string
  readonly cause?: unknown
}> {}

/**
 * Error thrown when ADT member detection fails
 */
export class ADTDetectionError extends Data.TaggedError('ADTDetectionError')<{
  readonly tag: string
  readonly adtName: string
  readonly reason: string
  readonly cause?: unknown
}> {}

// ============================================================================
// Error Union
// ============================================================================

/**
 * Union of all possible Bridge errors
 */
export type BridgeErrors =
  | AssetNotFoundError
  | SchemaVersionError
  | InvalidSelectionError
  | MultiplePathsError
  | IOError
  | ADTDetectionError
