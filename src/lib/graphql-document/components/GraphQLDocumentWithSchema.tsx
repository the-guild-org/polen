import type { React } from '#dep/react/index'
import { useEffect, useState } from 'react'
import { useGraphQLSchema } from '../schema-context.js'
import { GraphQLDocument, type GraphQLDocumentProps } from './GraphQLDocument.js'

// Cache for highlighter
let highlighterCache: any = null

/**
 * GraphQL Document component that uses the schema context and handles syntax highlighting
 */
export const GraphQLDocumentWithSchema: React.FC<Omit<GraphQLDocumentProps, `schema` | `highlightedHtml`>> = (
  props,
) => {
  const schema = useGraphQLSchema()
  const [mounted, setMounted] = useState(false)
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)

    const loadHighlighter = async () => {
      try {
        // Load highlighter if not cached
        if (!highlighterCache) {
          const { highlightCode } = await import(`#lib/shiki/index`)
          highlighterCache = highlightCode
        }

        // Generate highlighted HTML
        const highlighted = await highlighterCache({
          code: props.children,
          lang: `graphql`,
          theme: `light`,
        })

        setHighlightedHtml(highlighted)
      } catch (error) {
        console.error(`Failed to load GraphQL document highlighter:`, error)
      }
    }

    loadHighlighter()
  }, [props.children])

  // Always render the same structure to avoid hydration issues
  const isInteractive = mounted && schema && highlightedHtml

  if (!isInteractive) {
    // Static fallback that looks like Shiki output
    return (
      <div className='graphql-document graphql-document-static' data-testid='graphql-document'>
        <pre
          className='shiki shiki-themes github-light tokyo-night'
          style={{ backgroundColor: `var(--shiki-light-bg)`, color: `var(--shiki-light)` }}
        >
          <code className="language-graphql">{props.children}</code>
        </pre>
      </div>
    )
  }

  return (
    <GraphQLDocument
      {...props}
      schema={schema}
      highlightedHtml={highlightedHtml}
    />
  )
}
