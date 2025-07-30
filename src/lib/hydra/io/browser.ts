import { Effect, Layer } from 'effect'
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
          catch: (error) => new Error(`Failed to read ${relativePath}: ${error}`),
        }),

      write: (_relativePath: string, _data: string) =>
        Effect.fail(
          new Error('Write operations not supported in browser'),
        ),

      list: (_relativePath: string) =>
        Effect.fail(
          new Error('List operations not supported in browser'),
        ),

      remove: (_relativePath: string) =>
        Effect.fail(
          new Error('Remove operations not supported in browser'),
        ),
    },
  )
}
