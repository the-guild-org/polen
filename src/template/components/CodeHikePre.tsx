import { Pre as CodeHikePre } from 'codehike/code'
import React from 'react'
import { GraphQLDocument } from '../../lib/graphql-document/components/GraphQLDocument.js'

type CodeHikePreProps = React.ComponentProps<typeof CodeHikePre>
type HTMLPreProps = React.ComponentPropsWithoutRef<'pre'>
type PreProps = CodeHikePreProps | HTMLPreProps

/**
 * Custom Pre component that adds interactive GraphQL support to Code Hike
 *
 * Usage in MDX:
 * ```graphql interactive
 * query { ... }
 * ```
 */
export const Pre: React.FC<PreProps> = (props) => {
  // Check if this is a Code Hike pre component (has 'code' prop)
  if ('code' in props && props.code) {
    const { code } = props

    // Check if this is an interactive GraphQL block
    if (code.lang === 'graphql' && code.meta?.includes('interactive')) {
      // Extract the GraphQL schema if available
      const schema = typeof window !== 'undefined'
        ? (window as any).__POLEN_GRAPHQL_SCHEMA__
        : null

      // For interactive GraphQL blocks, we need to apply Code Hike's styling
      // but add GraphQLDocument's interactive features
      return (
        <GraphQLDocument
          schema={schema}
          options={{
            className: 'ch-code-container',
            // Use Code Hike's Pre component for rendering
            renderCode: () => <CodeHikePre {...props as CodeHikePreProps} />,
          }}
        >
          {code.code}
        </GraphQLDocument>
      )
    }

    // For other Code Hike code blocks, use Code Hike's Pre
    return <CodeHikePre {...props as CodeHikePreProps} />
  }

  // For standard HTML pre elements, render as-is
  return <pre {...props as HTMLPreProps} />
}
