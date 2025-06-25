import React from 'react'
import { useNavigate } from 'react-router'
import { GraphQLDocument } from '../../../lib/graphql-document/components/GraphQLDocument.tsx'
import type { GraphQLDocumentProps } from '../../../lib/graphql-document/components/GraphQLDocument.tsx'
import { highlightCode } from '../../../lib/shiki/shiki.ts'

/**
 * Client-side wrapper that hydrates GraphQL documents with schema
 */
export const GraphQLDocumentWithSchema: React.FC<Omit<GraphQLDocumentProps, 'schema'>> = (props) => {
  try {
    const [schema, setSchema] = React.useState<any>(null)
    const [isClient, setIsClient] = React.useState(false)
    const [highlightedHtml, setHighlightedHtml] = React.useState<string | null>(null)

    React.useEffect(() => {
      setIsClient(true)

      // Highlight the code
      if (typeof props.children === 'string') {
        highlightCode({
          code: props.children,
          lang: 'graphql',
          theme: 'light', // You can make this dynamic based on theme
        }).then(html => {
          setHighlightedHtml(html)
        }).catch(err => {
          console.error('Failed to highlight code:', err)
        })
      }

      // Access virtual module only on client side
      if (typeof window !== 'undefined') {
        import('virtual:polen/project/data.jsonsuper').then(PROJECT_DATA => {
          const s = PROJECT_DATA.default?.schema?.versions?.[0]?.after
          console.log('[GraphQLDocumentWithSchema] Schema loaded:', !!s)
          if (s) {
            setSchema(s)
          }
        }).catch(err => {
          console.error('Failed to load schema:', err)
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
      if (typeof window !== 'undefined') {
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
    console.error('GraphQLDocumentWithSchema error:', err)
    return <div>Error rendering GraphQL document</div>
  }
}
