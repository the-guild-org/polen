'use client'

import React from 'react'
import { GraphQLDocument } from '../../../lib/graphql-document/components/GraphQLDocument.js'
import type { GraphQLDocumentProps } from '../../../lib/graphql-document/components/GraphQLDocument.js'

/**
 * Client-side wrapper that hydrates GraphQL documents with schema
 */
export const GraphQLDocumentWithSchema: React.FC<Omit<GraphQLDocumentProps, `schema`>> = (props) => {
  try {
    const [schema, setSchema] = React.useState<any>(null)
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
      setIsClient(true)

      // Access virtual module only on client side
      if (typeof window !== `undefined`) {
        import(`virtual:polen/project/data/schema.jsonsuper`).then(SCHEMA => {
          const s = SCHEMA.default?.versions?.[0]?.after
          // Schema loaded successfully
          if (s) {
            setSchema(s)
          }
        }).catch(() => {
          // Schema loading is optional - continue without it
        })
      }
    }, [])

    // During SSR, render a simple code block
    if (!isClient) {
      return (
        <div data-testid='graphql-document' className='graphql-document graphql-document-static'>
          <pre>
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
        <pre>
          <code className="language-graphql">{props.children}</code>
        </pre>
      </div>
    )
  }
}
