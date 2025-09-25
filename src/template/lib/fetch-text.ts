import { Ef } from '#dep/effect'
import { Data } from 'effect'

/**
 * Error type for fetch failures
 */
export class FetchError extends Data.TaggedError('FetchError')<{
  readonly url: string
  readonly status: number
  readonly statusText: string
}> {
  override get message() {
    return `Failed to fetch: ${this.url} (${this.status} ${this.statusText})`
  }
}

/**
 * Fetch text content from a URL
 * @param url - The URL to fetch from
 * @returns Effect with text content or FetchError
 *
 * @example
 * ```ts
 * // At application boundary (e.g., in React components)
 * const text = await Ef.runPromise(fetchText('https://api.example.com/data'))
 * ```
 */
export const fetchText = (url: string): Ef.Effect<string, FetchError> =>
  Ef.tryPromise({
    try: async () => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new FetchError({
          url,
          status: response.status,
          statusText: response.statusText,
        })
      }
      return await response.text()
    },
    catch: (error) => {
      // If it's already a FetchError, return it
      if (error instanceof FetchError) {
        return error
      }
      // Network errors or other exceptions
      return new FetchError({
        url,
        status: 0,
        statusText: 'Network Error',
      })
    },
  })

/**
 * Fetch text content from a URL (legacy Promise version for React boundaries)
 * @param url - The URL to fetch from
 * @returns Promise that resolves to the text content
 * @throws FetchError if the request fails
 * @deprecated Prefer using fetchText with Ef.runPromise at application boundaries
 */
export const fetchTextPromise = async (url: string): Promise<string> => {
  return Ef.runPromise(fetchText(url))
}
