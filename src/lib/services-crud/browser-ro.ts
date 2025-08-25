import { Data, Effect, Layer } from 'effect'
import { CrudService } from './service.js'

/**
 * Structured error types for browser read-only operations
 */
export class FetchError extends Data.TaggedError('FetchError')<{
  readonly url: string
  readonly status: number
  readonly statusText: string
}> {}

export class NetworkError extends Data.TaggedError('NetworkError')<{
  readonly relativePath: string
  readonly cause: unknown
}> {}

export class UnsupportedOperationError extends Data.TaggedError('UnsupportedOperationError')<{
  readonly operation: string
  readonly message: string
}> {}

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
      Effect.gen(function*() {
        const url = new URL(relativePath, normalizedBaseUrl).toString()

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (cause) => new NetworkError({ relativePath, cause }),
        })

        if (!response.ok) {
          return yield* Effect.fail(
            new FetchError({
              url,
              status: response.status,
              statusText: response.statusText,
            }),
          )
        }

        return yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (cause) => new NetworkError({ relativePath, cause }),
        })
      }),

    write: (_relativePath: string, _data: string) =>
      Effect.fail(
        new UnsupportedOperationError({
          operation: 'write',
          message: 'Write operations not supported by Browser Read-Only service. '
            + 'Use a server-side CRUD service or implement a custom browser service for your API.',
        }),
      ),

    list: (_relativePath: string) =>
      Effect.fail(
        new UnsupportedOperationError({
          operation: 'list',
          message: 'List operations not supported by Browser Read-Only service. '
            + 'Browser environments cannot list remote directories. '
            + 'Consider using a manifest file or selection-based loading.',
        }),
      ),

    remove: (_relativePath: string) =>
      Effect.fail(
        new UnsupportedOperationError({
          operation: 'remove',
          message: 'Remove operations not supported by Browser Read-Only service. '
            + 'Use a server-side CRUD service or implement a custom browser service for your API.',
        }),
      ),
  })
}
