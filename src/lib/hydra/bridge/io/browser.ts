import { Effect, Layer } from 'effect'
import { IOError } from '../errors.js'
import { IO } from './service.js'

// ============================================================================
// Browser/HTTP-based IO Layer
// ============================================================================

/**
 * Browser-based IO service layer using fetch API
 * Only supports read operations - write operations will fail
 * Returns raw string data - JSON parsing is handled by Bridge
 */
export const Browser = (baseUrl: string) => {
  // Ensure baseUrl ends with slash for proper URL joining
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'

  return Layer.succeed(
    IO,
    {
      read: (relativePath: string) =>
        Effect.tryPromise({
          try: async () => {
            const url = new URL(relativePath, normalizedBaseUrl).toString()
            const response = await fetch(url)

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            return await response.text()
          },
          catch: (error) => new IOError({ operation: 'read', path: relativePath, cause: error }),
        }),

      write: (_relativePath: string, _data: string) =>
        Effect.fail(
          new IOError({ operation: 'write', path: _relativePath, cause: 'Write operations not supported in browser' }),
        ),

      list: (_relativePath: string) =>
        Effect.fail(
          new IOError({ operation: 'list', path: _relativePath, cause: 'List operations not supported in browser' }),
        ),

      remove: (_relativePath: string) =>
        Effect.fail(
          new IOError({
            operation: 'remove',
            path: _relativePath,
            cause: 'Remove operations not supported in browser',
          }),
        ),
    },
  )
}
