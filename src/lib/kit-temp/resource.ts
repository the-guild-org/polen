import { FileSystem } from '@effect/platform'
import { Effect, Equivalence, Schema as S } from 'effect'
import * as Path from 'node:path'

// ============================================================================
// ============================ SCHEMA AND TYPE ================================
// ============================================================================

export interface ResourceConfig<$A, $I> {
  /**
   * A descriptive name for the resource
   */
  name: string
  /**
   * The file path (relative to the directory parameter in read/write)
   */
  path: string
  /**
   * The Effect Schema for encoding/decoding
   */
  schema: S.Schema<$A, $I>
}

export interface Resource<$A, $I> {
  /**
   * Read and decode the resource from a directory
   */
  read: (directory: string) => Effect.Effect<$A, ResourceError, FileSystem.FileSystem>
  /**
   * Encode and write the resource to a directory
   */
  write: (data: $A, directory: string) => Effect.Effect<void, ResourceError, FileSystem.FileSystem>
}

/**
 * Errors that can occur during resource operations
 */
export class FileNotFound extends S.TaggedError<FileNotFound>()('FileNotFound', {
  path: S.String,
  message: S.String,
}) {}

export class ReadError extends S.TaggedError<ReadError>()('ReadError', {
  path: S.String,
  message: S.String,
}) {}

export class WriteError extends S.TaggedError<WriteError>()('WriteError', {
  path: S.String,
  message: S.String,
}) {}

export class ParseError extends S.TaggedError<ParseError>()('ParseError', {
  path: S.String,
  message: S.String,
}) {}

export class EncodeError extends S.TaggedError<EncodeError>()('EncodeError', {
  message: S.String,
}) {}

export type ResourceError = FileNotFound | ReadError | WriteError | ParseError | EncodeError

// ============================================================================
// ============================== CONSTRUCTORS =================================
// ============================================================================

/**
 * Create a new Resource with the given configuration
 *
 * @example
 * ```ts
 * const manifest = Resource.create({
 *   name: 'my-manifest',
 *   path: 'manifest.json',
 *   schema: S.Struct({
 *     version: S.String,
 *     items: S.Array(S.String)
 *   })
 * })
 *
 * // Read from directory
 * const result = await manifest.read('./my-dir')
 * if (Either.isRight(result)) {
 *   console.log(result.right)
 * }
 * ```
 */
export const create = <A, I = A>(config: ResourceConfig<A, I>): Resource<A, I> => {
  const fullPath = (directory: string) => Path.join(directory, config.path)

  const read = (directory: string): Effect.Effect<A, ResourceError, FileSystem.FileSystem> =>
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem
      const filePath = fullPath(directory)

      // Check if file exists
      const exists = yield* fs.exists(filePath).pipe(
        Effect.mapError((error) =>
          new ReadError({
            path: filePath,
            message: `Failed to check if resource "${config.name}" exists: ${(error as any).message || String(error)}`,
          })
        ),
      )

      if (!exists) {
        return yield* new FileNotFound({
          path: filePath,
          message: `Resource "${config.name}" not found at ${filePath}`,
        })
      }

      // Read file content
      const content = yield* fs.readFileString(filePath).pipe(
        Effect.mapError((error) =>
          new ReadError({
            path: filePath,
            message: `Failed to read resource "${config.name}": ${(error as any).message || String(error)}`,
          })
        ),
      )

      // Parse JSON
      const parsed = yield* Effect.try({
        try: () => JSON.parse(content),
        catch: (error) =>
          new ParseError({
            path: filePath,
            message: `Invalid JSON in resource "${config.name}": ${
              error instanceof Error ? error.message : String(error)
            }`,
          }),
      })

      // Decode using schema
      return yield* S.decodeUnknown(config.schema)(parsed).pipe(
        Effect.mapError((error) =>
          new ParseError({
            path: filePath,
            message: `Invalid data in resource "${config.name}": ${error}`,
          })
        ),
      )
    })

  const write = (data: A, directory: string): Effect.Effect<void, ResourceError, FileSystem.FileSystem> =>
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem
      const filePath = fullPath(directory)

      // Encode using schema
      const encoded = yield* S.encode(config.schema)(data).pipe(
        Effect.mapError((error) =>
          new EncodeError({
            message: `Failed to encode resource "${config.name}": ${error}`,
          })
        ),
      )

      // Convert to JSON string
      const content = JSON.stringify(encoded, null, 2)

      // Ensure directory exists
      const dir = Path.dirname(filePath)
      yield* fs.makeDirectory(dir, { recursive: true }).pipe(
        Effect.mapError((error) =>
          new WriteError({
            path: filePath,
            message: `Failed to create directory for resource "${config.name}": ${
              (error as any).message || String(error)
            }`,
          })
        ),
      )

      // Write file
      yield* fs.writeFileString(filePath, content).pipe(
        Effect.mapError((error) =>
          new WriteError({
            path: filePath,
            message: `Failed to write resource "${config.name}": ${(error as any).message || String(error)}`,
          })
        ),
      )
    })

  return { read, write }
}

// ============================================================================
// =============================== EQUIVALENCE =================================
// ============================================================================

/**
 * Equivalence for ResourceError
 */
export const ResourceErrorEquivalence: Equivalence.Equivalence<ResourceError> = Equivalence.make(
  (a, b) =>
    a._tag === b._tag
    && (a._tag === 'EncodeError'
      ? a.message === (b as EncodeError).message
      : a.path === (b as FileNotFound | ReadError | WriteError | ParseError).path
        && a.message === b.message),
)

// ============================================================================
// =============================== TYPE GUARDS =================================
// ============================================================================

export const isFileNotFound = (error: ResourceError): error is FileNotFound => error._tag === 'FileNotFound'

export const isReadError = (error: ResourceError): error is ReadError => error._tag === 'ReadError'

export const isWriteError = (error: ResourceError): error is WriteError => error._tag === 'WriteError'

export const isParseError = (error: ResourceError): error is ParseError => error._tag === 'ParseError'

export const isEncodeError = (error: ResourceError): error is EncodeError => error._tag === 'EncodeError'

export const isResourceError = (u: unknown): u is ResourceError =>
  typeof u === 'object' && u !== null && '_tag' in u
  && (u._tag === 'FileNotFound' || u._tag === 'ReadError'
    || u._tag === 'WriteError' || u._tag === 'ParseError' || u._tag === 'EncodeError')

// ============================================================================
// ================================== CODEC ====================================
// ============================================================================

/**
 * Schema for ResourceError union
 */
export const ResourceErrorSchema = S.Union(
  FileNotFound,
  ReadError,
  WriteError,
  ParseError,
  EncodeError,
)

/**
 * Decode a value to ResourceError
 */
export const decodeResourceError = S.decodeUnknown(ResourceErrorSchema)

/**
 * Decode a value to ResourceError synchronously
 */
export const decodeResourceErrorSync = S.decodeUnknownSync(ResourceErrorSchema)

/**
 * Encode a ResourceError
 */
export const encodeResourceError = S.encode(ResourceErrorSchema)
