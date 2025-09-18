import { E } from '#dep/effect'

/**
 * Error type for fetch failures
 */
export interface FetchError {
  readonly _tag: 'FetchError'
  readonly url: string
  readonly status: number
  readonly statusText: string
  readonly message: string
}

const makeFetchError = (url: string, status: number, statusText: string): FetchError => ({
  _tag: 'FetchError',
  url,
  status,
  statusText,
  message: `Failed to fetch: ${url} (${status} ${statusText})`,
})

/**
 * Fetch text content from a URL
 * @param url - The URL to fetch from
 * @returns Either with text content on right or FetchError on left
 */
export const fetchTextEither = async (url: string): Promise<E.Either<string, FetchError>> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return E.left(makeFetchError(url, response.status, response.statusText))
    }
    const text = await response.text()
    return E.right(text)
  } catch (error) {
    // Network errors or other exceptions
    return E.left(makeFetchError(url, 0, 'Network Error'))
  }
}

/**
 * Fetch text content from a URL (legacy throwing version)
 * @param url - The URL to fetch from
 * @returns Promise that resolves to the text content
 * @throws Error if the request fails
 * @deprecated Use fetchTextEither for better error handling
 */
export const fetchText = async (url: string): Promise<string> => {
  const result = await fetchTextEither(url)
  if (E.isLeft(result)) {
    throw new Error(result.left.message)
  }
  return result.right
}
