/**
 * Fetch text content from a URL
 * @param url - The URL to fetch from
 * @returns Promise that resolves to the text content
 * @throws Error if the request fails
 */
export const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${url} (${response.status} ${response.statusText})`)
  }
  return response.text()
}
