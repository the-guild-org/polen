import type { HighlightedCode } from 'codehike/code'
import { highlight } from 'codehike/code'
import { Duration, Effect } from 'effect'
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
    const HIGHLIGHT_TIMEOUT = Duration.seconds(5)

    const highlightContent = async () => {
      try {
        const highlighted = await Effect.runPromise(
          Effect.tryPromise({
            try: () =>
              highlight(
                {
                  value: content,
                  lang: config.lang,
                  meta: metaString,
                },
                {
                  theme: 'github-light',
                },
              ),
            catch: (error) => new Error(`Highlight failed: ${error}`),
          }).pipe(
            Effect.timeout(HIGHLIGHT_TIMEOUT),
            Effect.catchTag(
              'TimeoutException',
              () => Effect.fail(new Error(`Highlight timeout after ${Duration.toSeconds(HIGHLIGHT_TIMEOUT)} seconds`)),
            ),
          ),
        )
        setHighlightedCode(highlighted)
      } catch (error) {
        console.error('Failed to highlight code:', error)
        setHighlightedCode(null)
      }
    }
    highlightContent()
  }, [content, config.lang, config.interactive])

  return highlightedCode
}
