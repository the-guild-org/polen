import type { HighlightedCode } from 'codehike/code'
import { highlight } from 'codehike/code'
import * as React from 'react'

/**
 * Hook to asynchronously highlight code content using CodeHike.
 *
 * @param content - The code content to highlight
 * @param lang - The language for syntax highlighting (default: 'graphql')
 * @param interactive - Whether to add interactive meta flag (default: false)
 * @returns The highlighted code object or null while loading
 */
export const useHighlighted = (
  content: string,
  options?: {
    lang?: string
    interactive?: boolean
  },
): HighlightedCode | null => {
  const config = {
    interactive: options?.interactive ?? false,
    lang: options?.lang ?? 'graphql',
  }

  const meta = []
  if (config.interactive) meta.push('interactive')
  const metaString = meta.join(' ')

  const [highlightedCode, setHighlightedCode] = React.useState<HighlightedCode | null>(null)

  React.useEffect(() => {
    const highlightContent = async () => {
      // Add a timeout to detect if highlight is hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Highlight timeout after 5 seconds')), 5000)
      })

      const highlightPromise = highlight(
        {
          value: content,
          lang: config.lang,
          meta: metaString,
        },
        {
          theme: 'github-light',
        },
      )

      const highlighted = await Promise.race([highlightPromise, timeoutPromise])

      setHighlightedCode(highlighted as any)
    }
    highlightContent()
  }, [content, config.lang, config.interactive])

  return highlightedCode
}
