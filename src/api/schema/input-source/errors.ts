import { Data } from 'effect'

/**
 * Error thrown when a schema input source fails to load or process
 */
export class InputSourceError extends Data.TaggedError('InputSourceError')<{
  readonly source: string
  readonly message: string
  readonly cause?: unknown
}> {}

/**
 * Error thrown when no schema files are found
 */
export class NoSchemaFilesError extends Data.TaggedError('NoSchemaFilesError')<{
  readonly path: string
  readonly source: string
}> {}

/**
 * Error thrown when introspection data is invalid
 */
export class InvalidIntrospectionError extends Data.TaggedError('InvalidIntrospectionError')<{
  readonly reason: string
  readonly data?: unknown
}> {}
