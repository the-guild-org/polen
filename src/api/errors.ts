import { Data } from 'effect'

// =====================================
// Config Errors
// =====================================

/**
 * Error thrown when config file cannot be found
 */
export class ConfigFileNotFoundError extends Data.TaggedError('ConfigFileNotFoundError')<{
  readonly path: string
}> {}

/**
 * Error thrown when config file cannot be imported
 */
export class ConfigImportError extends Data.TaggedError('ConfigImportError')<{
  readonly filePath: string
  readonly cause: unknown
}> {}

/**
 * Error thrown when config file has invalid format
 */
export class ConfigParseError extends Data.TaggedError('ConfigParseError')<{
  readonly filePath: string
  readonly parseErrors: unknown
}> {}

/**
 * Error thrown when config cannot be resolved from module
 */
export class ConfigResolveError extends Data.TaggedError('ConfigResolveError')<{
  readonly cause: unknown
}> {}

/**
 * Error thrown when package.json cannot be read
 */
export class PackageJsonReadError extends Data.TaggedError('PackageJsonReadError')<{
  readonly rootDir: string
  readonly cause: unknown
}> {}

// =====================================
// Static Site Errors
// =====================================

/**
 * Error thrown when Polen build manifest is not found
 */
export class PolenManifestNotFoundError extends Data.TaggedError('PolenManifestNotFoundError')<{
  readonly path: string
}> {}

/**
 * Error thrown when base path is invalid
 */
export class InvalidBasePathError extends Data.TaggedError('InvalidBasePathError')<{
  readonly basePath: string
}> {}

/**
 * Error thrown when target path already exists and is not empty
 */
export class TargetExistsError extends Data.TaggedError('TargetExistsError')<{
  readonly targetPath: string
}> {}

/**
 * Error thrown when HTML processing fails
 */
export class HtmlProcessingError extends Data.TaggedError('HtmlProcessingError')<{
  readonly filePath: string
  readonly reason: string
  readonly cause?: unknown
}> {}

/**
 * Error thrown when file system operation fails
 */
export class FileSystemError extends Data.TaggedError('FileSystemError')<{
  readonly operation: 'read' | 'write' | 'copy' | 'stat' | 'mkdir' | 'remove'
  readonly path: string
  readonly cause: unknown
}> {}

// =====================================
// Builder Errors
// =====================================

/**
 * Error thrown when Vite builder fails
 */
export class ViteBuilderError extends Data.TaggedError('ViteBuilderError')<{
  readonly phase: 'create' | 'build'
  readonly cause: unknown
}> {}

/**
 * Error thrown when server fails to start
 */
export class ServerStartupError extends Data.TaggedError('ServerStartupError')<{
  readonly port: number
  readonly message: string
  readonly cause?: unknown
}> {}

/**
 * Error thrown when server exits unexpectedly
 */
export class ServerExitError extends Data.TaggedError('ServerExitError')<{
  readonly port: number
  readonly code: number | null
  readonly signal: string | null
}> {}

/**
 * Error thrown when server startup times out
 */
export class ServerTimeoutError extends Data.TaggedError('ServerTimeoutError')<{
  readonly port: number
  readonly timeoutSeconds: number
}> {}

/**
 * Error thrown when port allocation fails
 */
export class PortAllocationError extends Data.TaggedError('PortAllocationError')<{
  readonly cause: unknown
}> {}

/**
 * Error thrown when route processing fails
 */
export class RouteProcessingError extends Data.TaggedError('RouteProcessingError')<{
  readonly route: string
  readonly cause: unknown
}> {}

/**
 * Error thrown when route fetch fails
 */
export class RouteFetchError extends Data.TaggedError('RouteFetchError')<{
  readonly route: string
  readonly status: number
  readonly statusText: string
}> {}

// =====================================
// Schema Loading Errors
// =====================================

/**
 * Error thrown when no applicable schema source is found
 */
export class NoApplicableSchemaSourceError extends Data.TaggedError('NoApplicableSchemaSourceError')<{}> {}

/**
 * Error thrown when schema source returns no data
 */
export class SchemaSourceNoDataError extends Data.TaggedError('SchemaSourceNoDataError')<{}> {}

// =====================================
// Schema Augmentation Errors
// =====================================

/**
 * Error thrown when a type cannot be found in the schema
 */
export class TypeNotFoundError extends Data.TaggedError('TypeNotFoundError')<{
  readonly typeName: string
}> {}

/**
 * Error thrown when a field cannot be found on a type
 */
export class FieldNotFoundError extends Data.TaggedError('FieldNotFoundError')<{
  readonly fieldName: string
  readonly typeName: string
}> {}

/**
 * Error thrown when a type doesn't have fields
 */
export class TypeHasNoFieldsError extends Data.TaggedError('TypeHasNoFieldsError')<{
  readonly typeName: string
}> {}

// =====================================
// Routes Manifest Errors
// =====================================

/**
 * Error thrown when routes manifest cannot be read
 */
export class RoutesManifestReadError extends Data.TaggedError('RoutesManifestReadError')<{
  readonly path: string
  readonly cause: unknown
}> {}

/**
 * Error thrown when routes manifest cannot be written
 */
export class RoutesManifestWriteError extends Data.TaggedError('RoutesManifestWriteError')<{
  readonly path: string
  readonly cause: unknown
}> {}

// =====================================
// Validation Errors
// =====================================

/**
 * Error thrown when base path validation fails
 */
export class InvalidPathError extends Data.TaggedError('InvalidPathError')<{
  readonly path: string
  readonly requirement: string
}> {}

/**
 * Error thrown when version string is invalid
 */
export class InvalidVersionError extends Data.TaggedError('InvalidVersionError')<{
  readonly version: string
}> {}
