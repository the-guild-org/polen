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
  lang: string = 'graphql',
  interactive: boolean = false,
): HighlightedCode | null => {
  const [highlightedCode, setHighlightedCode] = React.useState<HighlightedCode | null>(null)

  React.useEffect(() => {
    const highlightContent = async () => {
      try {
        // Add a timeout to detect if highlight is hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Highlight timeout after 5 seconds')), 5000)
        })
        
        const highlightPromise = highlight(
          { value: content, lang, meta: interactive ? 'interactive' : '' },
          { theme: 'github-light' },
        )
        
        const highlighted = await Promise.race([highlightPromise, timeoutPromise])
        
        setHighlightedCode(highlighted as any)
      } catch (error) {
        // Silently handle errors - the component will gracefully degrade
      }
    }
    highlightContent()
  }, [content, lang, interactive])

  return highlightedCode
}