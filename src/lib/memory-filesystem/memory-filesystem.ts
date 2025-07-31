import { SystemError } from '@effect/platform/Error'
import { FileSystem } from '@effect/platform/FileSystem'
import { Effect, Layer } from 'effect'

// ============================================================================
// Error Factories
// ============================================================================

const createUnsupportedError = (method: string, operation: string) =>
  new SystemError({
    reason: 'PermissionDenied',
    module: 'FileSystem',
    method,
    description: `${operation} not supported in memory filesystem`,
  })

const createNotFoundError = (method: string, path: string, operation: string) =>
  new SystemError({
    reason: 'NotFound',
    module: 'FileSystem',
    method,
    pathOrDescriptor: path,
    description: `ENOENT: no such file or directory, ${operation} '${path}'`,
  })

// Convenience factories for common patterns
const failUnsupported = (method: string, operation: string) => Effect.fail(createUnsupportedError(method, operation))

const failNotFound = (method: string, path: string, operation: string) =>
  Effect.fail(createNotFoundError(method, path, operation))

// ============================================================================
// Memory Filesystem Types
// ============================================================================

/**
 * Memory filesystem disk layout specification.
 * Keys are file paths, values are file contents as strings.
 */
export interface DiskLayout {
  readonly [path: string]: string
}

// ============================================================================
// Memory Filesystem Layer Factory
// ============================================================================

/**
 * Creates a memory filesystem layer from a disk layout specification.
 * This layer can be composed with other layers for testing.
 *
 * @param diskLayout - Object mapping file paths to their contents
 * @returns Layer that provides a FileSystem service backed by memory
 */
export const layer = (diskLayout: DiskLayout) =>
  Layer.succeed(
    FileSystem,
    {
      // File existence check
      exists: (path: string) => Effect.succeed(path in diskLayout),

      // Read file as string
      readFileString: (path: string) => {
        const content = diskLayout[path]
        return content !== undefined
          ? Effect.succeed(content)
          : failNotFound('readFileString', path, 'open')
      },

      // Read directory contents
      readDirectory: (path: string) => {
        const normalizedPath = path.endsWith('/') ? path : path + '/'
        const entries = Object.keys(diskLayout)
          .filter(filePath => filePath.startsWith(normalizedPath))
          .map(filePath => filePath.slice(normalizedPath.length))
          .filter(relativePath => relativePath.length > 0 && !relativePath.includes('/'))

        return entries.length > 0
          ? Effect.succeed(entries)
          : failNotFound('readDirectory', path, 'scandir')
      },

      // File stats (simplified - just checks existence)
      stat: (path: string) => {
        if (path in diskLayout) {
          return Effect.succeed({
            isFile: () => true,
            isDirectory: () => false,
            isSymbolicLink: () => false,
            size: diskLayout[path]!.length,
          } as any)
        }

        // Check if it's a directory (has files under it)
        const normalizedPath = path.endsWith('/') ? path : path + '/'
        const hasChildren = Object.keys(diskLayout).some(filePath =>
          filePath.startsWith(normalizedPath) && filePath !== path
        )

        if (hasChildren) {
          return Effect.succeed({
            isFile: () => false,
            isDirectory: () => true,
            isSymbolicLink: () => false,
            size: 0,
          } as any)
        }

        return failNotFound('stat', path, 'stat')
      },

      // Stub implementations for write operations (not needed for read-only testing)
      writeFileString: () => failUnsupported('writeFileString', 'Write operations'),
      writeFile: () => failUnsupported('writeFile', 'Write operations'),
      truncate: () => failUnsupported('truncate', 'Write operations'),
      remove: () => failUnsupported('remove', 'Write operations'),
      makeDirectory: () => failUnsupported('makeDirectory', 'Write operations'),
      makeTempDirectory: () => failUnsupported('makeTempDirectory', 'Write operations'),
      makeTempDirectoryScoped: () => failUnsupported('makeTempDirectoryScoped', 'Write operations'),
      makeTempFile: () => failUnsupported('makeTempFile', 'Write operations'),
      makeTempFileScoped: () => failUnsupported('makeTempFileScoped', 'Write operations'),
      open: () => failUnsupported('open', 'File operations'),
      copy: () => failUnsupported('copy', 'Write operations'),
      copyFile: () => failUnsupported('copyFile', 'Write operations'),
      chmod: () => failUnsupported('chmod', 'Write operations'),
      chown: () => failUnsupported('chown', 'Write operations'),
      access: (path: string) =>
        path in diskLayout
          ? Effect.void
          : failNotFound('access', path, 'access'),
      link: () => failUnsupported('link', 'Write operations'),
      realPath: (path: string) => Effect.succeed(path),
      readFile: (path: string) => {
        const content = diskLayout[path]
        return content !== undefined
          ? Effect.succeed(new TextEncoder().encode(content))
          : failNotFound('readFile', path, 'open')
      },
      readLink: () => failUnsupported('readLink', 'Symlink operations'),
      symlink: () => failUnsupported('symlink', 'Write operations'),
      utimes: () => failUnsupported('utimes', 'Write operations'),
      watch: () => failUnsupported('watch', 'Watch operations'),

      // Rename/move files (not implemented for memory filesystem)
      rename: () => failUnsupported('rename', 'Write operations'),

      // Create writable sink (not implemented for memory filesystem)
      sink: () => failUnsupported('sink', 'Stream operations'),

      // Create readable stream (not implemented for memory filesystem)
      stream: () => failUnsupported('stream', 'Stream operations'),
    },
  )

/**
 * Convenience function for creating memory filesystem layers from disk layout.
 * This matches the API used in schema tests.
 *
 * @param diskLayout - Object mapping file paths to their contents
 * @returns Layer that provides an Effect Platform FileSystem service backed by memory
 */
export const layerFromDiskLayout = (diskLayout: DiskLayout) => layer(diskLayout)
