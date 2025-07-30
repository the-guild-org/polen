import { Effect, Layer } from 'effect'
import * as path from 'node:path'
import { IO } from './service.js'

/**
 * In-memory IO service layer for testing
 * Stores data as strings, matching the IOService interface
 *
 * @param options - Configuration options
 * @param options.basePath - Optional base path to simulate directory structure
 * @param options.initialFiles - Initial files as a Map or Record
 */
export const Memory = (options?: {
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
