import { FileSystem } from '@effect/platform/FileSystem'
import { Context, Effect, Layer } from 'effect'
import * as path from 'node:path'

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
// Hydra IO Service Interface (for compatibility)
// ============================================================================

/**
 * IO operations service interface compatible with Hydra Bridge
 * Provides basic file operations for string data
 */
export interface IOService {
  readonly read: (relativePath: string) => Effect.Effect<string, Error>
  readonly write: (relativePath: string, data: string) => Effect.Effect<void, Error>
  readonly list: (relativePath: string) => Effect.Effect<ReadonlyArray<string>, Error>
  readonly remove: (relativePath: string) => Effect.Effect<void, Error>
}

export const IO = Context.GenericTag<IOService>('@memory-filesystem/IO')

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
    FileSystem.make({
      // File existence check
      exists: (path: string) => Effect.succeed(path in diskLayout),

      // Read file as string
      readFileString: (path: string) => {
        const content = diskLayout[path]
        return content !== undefined
          ? Effect.succeed(content)
          : Effect.fail(new Error(`ENOENT: no such file or directory, open '${path}'`))
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
          : Effect.fail(new Error(`ENOENT: no such file or directory, scandir '${path}'`))
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

        return Effect.fail(new Error(`ENOENT: no such file or directory, stat '${path}'`))
      },

      // Stub implementations for write operations (not needed for read-only testing)
      writeFileString: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      writeFile: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      truncate: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      remove: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      makeDirectory: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      makeTempDirectory: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      makeTempDirectoryScoped: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      makeTempFile: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      makeTempFileScoped: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      open: () => Effect.fail(new Error('File operations not supported in memory filesystem')),
      copy: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      copyFile: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      chmod: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      chown: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      access: (path: string) =>
        path in diskLayout
          ? Effect.void
          : Effect.fail(new Error(`ENOENT: no such file or directory, access '${path}'`)),
      link: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      realPath: (path: string) => Effect.succeed(path),
      readFile: (path: string) => {
        const content = diskLayout[path]
        return content !== undefined
          ? Effect.succeed(new TextEncoder().encode(content))
          : Effect.fail(new Error(`ENOENT: no such file or directory, open '${path}'`))
      },
      readLink: () => Effect.fail(new Error('Symlink operations not supported in memory filesystem')),
      symlink: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      utimes: () => Effect.fail(new Error('Write operations not supported in memory filesystem')),
      watch: () => Effect.fail(new Error('Watch operations not supported in memory filesystem')),
    }),
  )

// ============================================================================
// Hydra IO Service Layer Factory
// ============================================================================

/**
 * Creates a Hydra IO service layer from a disk layout specification.
 * This provides the simpler IO interface compatible with Hydra Bridge.
 *
 * @param options - Configuration options
 * @param options.basePath - Optional base path to simulate directory structure
 * @param options.initialFiles - Initial files as a Map or Record
 * @returns Layer that provides a Hydra IO service backed by memory
 */
export const ioLayer = (options?: {
  basePath?: string
  initialFiles?: Map<string, string> | Record<string, string>
}) => {
  const basePath = options?.basePath || '.'
  const initialFilesInput = options?.initialFiles instanceof Map
    ? options.initialFiles
    : new Map(Object.entries(options?.initialFiles || {}))

  // Convert initial files to use full paths
  const files = new Map<string, string>()
  for (const [filename, content] of initialFilesInput) {
    const fullPath = path.join(basePath, filename)
    files.set(fullPath, content)
  }

  return Layer.succeed(
    IO,
    {
      read: (relativePath: string) =>
        Effect.gen(function*() {
          const fullPath = path.join(basePath, relativePath)
          const content = files.get(fullPath)
          if (content === undefined) {
            return yield* Effect.fail(new Error(`File not found: ${relativePath}`))
          }
          return content
        }),

      write: (relativePath: string, data: string) =>
        Effect.sync(() => {
          const fullPath = path.join(basePath, relativePath)
          files.set(fullPath, data)
        }),

      list: (relativePath: string) =>
        Effect.sync(() => {
          const searchPath = path.join(basePath, relativePath)
          // Return only filenames in the given directory
          return Array.from(files.keys())
            .filter(filePath => {
              const dir = path.dirname(filePath)
              return dir === searchPath || (searchPath === basePath && dir === searchPath)
            })
            .map(filePath => path.basename(filePath))
        }),

      remove: (relativePath: string) =>
        Effect.sync(() => {
          const fullPath = path.join(basePath, relativePath)
          files.delete(fullPath)
        }),
    },
  )
}

/**
 * Convenience function for creating memory filesystem layers from disk layout.
 * This matches the API used in schema tests.
 *
 * @param diskLayout - Object mapping file paths to their contents
 * @returns Layer that provides an Effect Platform FileSystem service backed by memory
 */
export const layerFromDiskLayout = (diskLayout: DiskLayout) => layer(diskLayout)
