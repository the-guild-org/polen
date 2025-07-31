import { Effect, Layer } from 'effect'
import { CrudService } from './service.js'

/**
 * Create a read-only CRUD service layer for browser environments.
 *
 * This service uses the fetch API to read files from a remote server.
 * Write, list, and remove operations are not supported and will fail
 * with descriptive error messages.
 *
 * This is ideal for:
 * - Loading static data from a CDN or static server
 * - Reading configuration files in browser applications
 * - Fetching pre-generated data exports
 *
 * For write operations in browser environments, implement a custom
 * service that uses your API endpoints.
 *
 * @param baseUrl - Base URL for all fetch operations
 * @returns Layer providing read-only CrudService backed by HTTP fetch
 */
export const browserReadOnly = (baseUrl: string) => {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'

  return Layer.succeed(CrudService, {
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
        new Error(
          'Write operations not supported by Browser Read-Only service. '
            + 'Use a server-side CRUD service or implement a custom browser service for your API.',
        ),
      ),

    list: (_relativePath: string) =>
      Effect.fail(
        new Error(
          'List operations not supported by Browser Read-Only service. '
            + 'Browser environments cannot list remote directories. '
            + 'Consider using a manifest file or selection-based loading.',
        ),
      ),

    remove: (_relativePath: string) =>
      Effect.fail(
        new Error(
          'Remove operations not supported by Browser Read-Only service. '
            + 'Use a server-side CRUD service or implement a custom browser service for your API.',
        ),
      ),
  })
}
