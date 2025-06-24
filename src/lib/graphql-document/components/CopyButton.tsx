/**
 * Copy button component for GraphQL documents
 */

import type { React } from '#dep/react/index'
import { React as ReactHooks } from '#dep/react/index'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'
import { Button } from '@radix-ui/themes'

export interface CopyButtonProps {
  /** The text to copy */
  text: string
  /** Optional className */
  className?: string
  /** Size variant */
  size?: '1' | '2' | '3'
}

/**
 * Copy button for GraphQL code blocks
 *
 * Shows a copy icon that changes to a checkmark when clicked
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = '',
  size = '1',
}) => {
  const [copied, setCopied] = ReactHooks.useState(false)
  const timeoutRef = ReactHooks.useRef<NodeJS.Timeout | null>(null)

  const handleCopy = ReactHooks.useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Reset after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setCopied(false)
        timeoutRef.current = null
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }, [text])

  // Cleanup timeout on unmount
  ReactHooks.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <Button
      size={size}
      variant='ghost'
      className={`graphql-copy-button ${className}`}
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : 'Copy code'}
      data-copied={copied}
    >
      {copied ? <CheckIcon width='16' height='16' /> : <CopyIcon width='16' height='16' />}
    </Button>
  )
}
