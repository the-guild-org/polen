import React from 'react'
import { GraphQLDocument } from '../../../lib/graphql-document/components/GraphQLDocument.tsx'
import type { GraphQLDocumentProps } from '../../../lib/graphql-document/components/GraphQLDocument.tsx'
import { highlightCode } from '../../../lib/shiki/shiki.ts'

/**
 * Client-side wrapper that hydrates GraphQL documents with schema
 */
export const GraphQLDocumentWithSchema: React.FC<Omit<GraphQLDocumentProps, `schema`>> = (props) => {
  try {
    const [schema, setSchema] = React.useState<any>(null)
    const [isClient, setIsClient] = React.useState(false)
    const [highlightedHtml, setHighlightedHtml] = React.useState<string | null>(null)

    React.useEffect(() => {
      setIsClient(true)

      // Highlight the code
      if (typeof props.children === `string`) {
        highlightCode({
          code: props.children,
          lang: `graphql`,
          theme: `light`, // You can make this dynamic based on theme
        }).then(html => {
          setHighlightedHtml(html)
        }).catch(() => {
          // Silently fall back to unhighlighted code
        })
      }

      // Access virtual module only on client side
      if (typeof window !== `undefined`) {
        import(`virtual:polen/project/data.jsonsuper`).then(PROJECT_DATA => {
          const s = PROJECT_DATA.default?.schema?.versions?.[0]?.after
          // Schema loaded successfully
          if (s) {
            setSchema(s)
          }
        }).catch(() => {
          // Schema loading is optional - continue without it
        })
      }
    }, [props.children])

    // During SSR, render a simple code block
    if (!isClient) {
      return (
        <div data-testid='graphql-document' className='graphql-document graphql-document-static'>
          <pre className='shiki shiki-themes github-light tokyo-night'>
            <code className="language-graphql">{props.children}</code>
          </pre>
        </div>
      )
    }

    // During client render, use the full component
    // Pass a custom navigate function that doesn't require router
    const handleNavigate = (url: string) => {
      if (typeof window !== `undefined`) {
        window.location.href = url
      }
    }

    return (
      <div data-testid='graphql-document'>
        <GraphQLDocument
          {...props}
          schema={schema}
          highlightedHtml={highlightedHtml || undefined}
          options={{
            debug: false, // Default to false for shipping
            ...props.options,
            onNavigate: handleNavigate,
          }}
        />
      </div>
    )
  } catch (err) {
    // Fall back to plain code block on error
    return (
      <div data-testid='graphql-document' className='graphql-document graphql-document-static'>
        <pre className='shiki'>
          <code className="language-graphql">{props.children}</code>
        </pre>
      </div>
    )
  }
}
