import { Effect, Layer } from 'effect'
import { IOError } from '../errors.js'
import { IO } from './service.js'

// ============================================================================
// In-memory Test IO Layer
// ============================================================================

/**
 * In-memory IO service layer for testing
 * Stores data as strings, matching the IOService interface
 */
export const MemoryTest = (initialFiles?: Map<string, string>) => {
  const files = new Map<string, string>(initialFiles || [])

  return Layer.succeed(
    IO,
    {
      read: (relativePath: string) =>
        Effect.gen(function*() {
          const content = files.get(relativePath)
          if (content === undefined) {
            return yield* Effect.fail(new IOError({ operation: 'read', path: relativePath, cause: 'File not found' }))
          }
          return content
        }),

      write: (relativePath: string, data: string) =>
        Effect.sync(() => {
          files.set(relativePath, data)
        }),

      list: (_relativePath: string) =>
        Effect.sync(() => {
          // Return all file names
          return Array.from(files.keys())
        }),

      remove: (relativePath: string) =>
        Effect.sync(() => {
          files.delete(relativePath)
        }),
    },
  )
}
