import { type HighlightedCode, Pre } from 'codehike/code'
import type { GraphQLSchema } from 'graphql'
import React from 'react'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { GraphQLInteractive } from './GraphQLInteractive/index.js'

interface CodeBlockProps {
  codeblock: HighlightedCode
  schema?: GraphQLSchema
}

/**
 * Code block component for Code Hike
 * Handles pre-highlighted code blocks and interactive GraphQL blocks
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ codeblock, schema }) => {
  // Check if this is an interactive GraphQL block
  if (codeblock.lang === 'graphql' && codeblock.meta?.includes('interactive')) {
    return (
      <GraphQLInteractive
        codeblock={codeblock}
        schema={schema}
        showWarningIfNoSchema={PROJECT_DATA.warnings.interactiveWithoutSchema.enabled}
      />
    )
  }

  // For regular code blocks, use Code Hike's Pre component with pre-highlighted code
  return <Pre code={codeblock} />
}
