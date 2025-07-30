import { Effect, Layer } from 'effect'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { IOError } from '../errors.js'
import { IO } from './service.js'

// ============================================================================
// File-based IO Layer
// ============================================================================

/**
 * Node.js file system based IO service layer
 * Only handles string operations - JSON parsing/stringifying is done by Bridge
 */
export const File = (basePath: string) =>
  Layer.succeed(
    IO,
    {
      read: (relativePath: string) =>
        Effect.tryPromise({
          try: async () => {
            const fullPath = path.join(basePath, relativePath)
            const content = await fs.readFile(fullPath, 'utf-8')
            return content
          },
          catch: (error) => new IOError({ operation: 'read', path: relativePath, cause: error }),
        }),

      write: (relativePath: string, data: string) =>
        Effect.tryPromise({
          try: async () => {
            const fullPath = path.join(basePath, relativePath)
            await fs.writeFile(fullPath, data, 'utf-8')
          },
          catch: (error) => new IOError({ operation: 'write', path: relativePath, cause: error }),
        }),

      list: (relativePath: string) =>
        Effect.tryPromise({
          try: async () => {
            const fullPath = path.join(basePath, relativePath)
            const entries = await fs.readdir(fullPath)
            return entries
          },
          catch: (error) => new IOError({ operation: 'list', path: relativePath, cause: error }),
        }),

      remove: (relativePath: string) =>
        Effect.tryPromise({
          try: async () => {
            const fullPath = path.join(basePath, relativePath)
            await fs.unlink(fullPath)
          },
          catch: (error) => new IOError({ operation: 'remove', path: relativePath, cause: error }),
        }),
    },
  )
