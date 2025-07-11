import { type HighlightedCode, Pre } from 'codehike/code'
import React from 'react'
import { GraphQLDocument } from '../../lib/graphql-document/components/GraphQLDocument.js'

interface CodeBlockProps {
  codeblock: HighlightedCode
}

/**
 * Code block component for Code Hike
 * Handles pre-highlighted code blocks and interactive GraphQL blocks
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ codeblock }) => {
  // Check if this is an interactive GraphQL block
  if (codeblock.lang === 'graphql' && codeblock.meta?.includes('interactive')) {
    const schema = typeof window !== 'undefined'
      ? (window as any).__POLEN_GRAPHQL_SCHEMA__
      : null

    return (
      <GraphQLDocument
        schema={schema}
        options={{
          className: 'ch-code-container',
          renderCode: () => <Pre code={codeblock} />,
        }}
      >
        {codeblock.value}
      </GraphQLDocument>
    )
  }

  // For regular code blocks, use Code Hike's Pre component with pre-highlighted code
  return <Pre code={codeblock} />
}
