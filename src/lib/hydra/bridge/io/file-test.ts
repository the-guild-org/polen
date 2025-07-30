import { Effect, Layer } from 'effect'
import * as path from 'node:path'
import { IOError } from '../errors.js'
import { IO } from './service.js'

/**
 * In-memory IO service layer for testing
 * Stores data as parsed objects, not strings
 */
export const LayerFileTest = (basePath: string, initialFiles?: Record<string, string>) => {
  const files = new Map<string, string>(Object.entries(initialFiles || {}))

  return Layer.succeed(
    IO,
    {
      read: (relativePath: string) =>
        Effect.gen(function*() {
          const fullPath = path.join(basePath, relativePath)
          const content = files.get(fullPath)
          if (content === undefined) {
            return yield* Effect.fail(new IOError({ operation: 'read', path: relativePath, cause: 'File not found' }))
          }
          return content
        }),

      write: (relativePath: string, data: string) =>
        Effect.sync(() => {
          const fullPath = path.join(basePath, relativePath)
          files.set(fullPath, data)
        }),

      list: (_relativePath: string) =>
        Effect.sync(() => {
          // Return only filenames, not full paths
          return Array.from(files.keys()).map(filePath => path.basename(filePath))
        }),

      remove: (relativePath: string) =>
        Effect.sync(() => {
          const fullPath = path.join(basePath, relativePath)
          files.delete(fullPath)
        }),
    },
  )
}
