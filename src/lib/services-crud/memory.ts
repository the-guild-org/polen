import { A } from '#dep/effect'
import { Path } from '@wollybeard/kit'
import { Effect, Layer } from 'effect'
import { CrudService } from './service.js'

/**
 * Options for configuring the memory CRUD service.
 */
export interface MemoryOptions {
  /**
   * Base path for all operations (defaults to '.')
   */
  basePath?: string

  /**
   * Initial files to populate the memory filesystem
   */
  initialFiles?: Map<string, string> | Record<string, string>
}

/**
 * Create a CRUD service layer backed by in-memory storage.
 *
 * This service stores all data in memory using a Map, making it perfect for:
 * - Unit testing with isolated, predictable state
 * - Temporary data storage that doesn't need persistence
 * - Fast operations without disk I/O overhead
 *
 * The service maintains proper path semantics and directory structure
 * simulation while keeping everything in memory.
 *
 * @param options - Configuration options
 * @returns Layer providing CrudService backed by memory storage
 */
export const memory = (options?: MemoryOptions) => {
  const basePath = options?.basePath || '.'
  const initialFilesInput = options?.initialFiles instanceof Map
    ? options.initialFiles
    : new Map(Object.entries(options?.initialFiles || {}))

  // Convert initial files to use full paths and create persistent storage
  const files = new Map<string, string>()
  for (const [filename, content] of initialFilesInput) {
    const fullPath = Path.join(basePath, filename)
    files.set(fullPath, content)
  }

  return Layer.succeed(CrudService, {
    read: (relativePath: string) =>
      Effect.sync(() => {
        const fullPath = Path.join(basePath, relativePath)
        const content = files.get(fullPath)
        if (content === undefined) {
          throw new Error(`File not found: ${relativePath}`)
        }
        return content
      }),

    write: (relativePath: string, data: string) =>
      Effect.sync(() => {
        const fullPath = Path.join(basePath, relativePath)
        files.set(fullPath, data)
      }),

    list: (relativePath: string) =>
      Effect.sync(() => {
        const searchPath = Path.join(basePath, relativePath)
        const normalizedSearchPath = searchPath.endsWith('/') ? searchPath : searchPath + '/'

        // Find all files in the directory
        return A.fromIterable(files.keys())
          .filter(filePath => {
            const dir = Path.dirname(filePath)
            const normalizedDir = dir.endsWith('/') ? dir : dir + '/'
            return normalizedDir === normalizedSearchPath
              || (searchPath === basePath && dir === searchPath)
          })
          .map(filePath => Path.basename(filePath))
      }),

    remove: (relativePath: string) =>
      Effect.sync(() => {
        const fullPath = Path.join(basePath, relativePath)
        files.delete(fullPath)
      }),
  })
}
