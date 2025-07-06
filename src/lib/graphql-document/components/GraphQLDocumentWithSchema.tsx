import type { React } from '#dep/react/index'
import { useEffect, useState } from 'react'
import { useGraphQLSchema } from '../schema-context.js'
import { GraphQLDocument, type GraphQLDocumentProps } from './GraphQLDocument.js'

/**
 * GraphQL Document component that uses the schema context
 */
export const GraphQLDocumentWithSchema: React.FC<Omit<GraphQLDocumentProps, `schema` | `highlightedHtml`>> = (
  props,
) => {
  const schema = useGraphQLSchema()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render the same structure to avoid hydration issues
  const isInteractive = mounted && schema

  if (!isInteractive) {
    // Static fallback
    return (
      <div className='graphql-document graphql-document-static' data-testid='graphql-document'>
        <pre
          style={{
            backgroundColor: `var(--gray-a2)`,
            color: `var(--gray-12)`,
            padding: `var(--space-3)`,
            borderRadius: `var(--radius-3)`,
          }}
        >
          <code className="language-graphql">{props.children}</code>
        </pre>
      </div>
    )
  }

  // Simple highlighted HTML without syntax highlighting
  const highlightedHtml =
    `<pre style="background-color: var(--gray-a2); color: var(--gray-12); padding: var(--space-3); border-radius: var(--radius-3);"><code class="language-graphql">${props.children}</code></pre>`

  return (
    <GraphQLDocument
      {...props}
      schema={schema}
      highlightedHtml={highlightedHtml}
    />
  )
}
