import { highlightCode } from '#lib/shiki/index'
import React, { useEffect, useState } from 'react'

interface CodeBlockProps {
  children: string
  language?: string
  className?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  diffLines?: { add: number[]; remove: number[] }
  focusLines?: number[]
  showInvisibles?: boolean
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language = `text`,
  className = ``,
  showLineNumbers = false,
  highlightLines = [],
  diffLines,
  focusLines = [],
  showInvisibles = false,
}) => {
  const [html, setHtml] = useState<string>(``)
  const [isLoading, setIsLoading] = useState(true)

  // TODO: Implement proper theme detection
  // For now, we'll rely on CSS to handle theme switching
  const theme = `light` // Default to light theme

  useEffect(() => {
    const renderCode = async () => {
      try {
        const output = await highlightCode({
          code: children,
          lang: language,
          theme,
          showLineNumbers,
          highlightLines,
          diffLines,
          focusLines,
          showInvisibles,
        })

        setHtml(output)
      } catch (error) {
        console.error(`Failed to highlight code:`, error)
        // Fallback to plain text
        setHtml(`<pre><code>${children}</code></pre>`)
      } finally {
        setIsLoading(false)
      }
    }

    renderCode()
  }, [children, language, showLineNumbers, highlightLines, diffLines, focusLines, showInvisibles])

  if (isLoading) {
    return (
      <pre className={className}>
        <code>{children}</code>
      </pre>
    )
  }

  return (
    <div
      className={`code-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
