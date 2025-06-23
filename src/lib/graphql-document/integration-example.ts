/**
 * Example of integrating GraphQL Document component with Polen
 *
 * This shows how to modify Polen's pages plugin to support
 * interactive GraphQL code blocks.
 */

import type { GraphQLSchema } from 'graphql'
import { createPolenRehypePlugin } from './polen-integration.ts'

/**
 * Example: Modified pages plugin configuration
 *
 * This would be added to src/api/vite/plugins/pages.ts
 */
export const examplePagesPluginConfig = (schema: GraphQLSchema) => ({
  // ... existing mdx config ...
  rehypePlugins: [
    // ... existing plugins like rehypeShiki ...

    // Add GraphQL document support
    createPolenRehypePlugin({
      schema,
      validateAtBuildTime: true,
      referencePath: '/reference',
    }),
  ],
})

/**
 * Example: Using GraphQL blocks in markdown
 */
export const exampleMarkdown = `
# GraphQL Query Examples

## Basic Query

\`\`\`graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts {
      id
      title
    }
  }
}
\`\`\`

## Plain Mode (no interactivity)

\`\`\`graphql plain
query {
  users {
    name
  }
}
\`\`\`

## Debug Mode

\`\`\`graphql debug
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    author {
      name
    }
  }
}
\`\`\`

## With Validation Disabled

\`\`\`graphql validate=false
# This might have errors but won't fail the build
query {
  nonExistentField
}
\`\`\`
`

/**
 * Example: Component usage in React
 */
export const exampleReactUsage = `
import React from 'react'
import { GraphQLDocument } from 'polen/graphql-document'
import { useGraphQLSchema } from './schema-context'

export function GraphQLExample() {
  const schema = useGraphQLSchema()
  
  const query = \`
    query GetUser {
      user {
        name
        email
      }
    }
  \`
  
  return (
    <div>
      <h2>Interactive GraphQL Query</h2>
      <GraphQLDocument schema={schema}>
        {query}
      </GraphQLDocument>
    </div>
  )
}
`

/**
 * Example: Custom navigation handler
 */
export const exampleCustomNavigation = `
<GraphQLDocument 
  schema={schema}
  options={{
    onNavigate: (url) => {
      // Custom navigation logic
      console.log('Navigating to:', url)
      router.push(url)
    },
    debug: process.env.NODE_ENV === 'development',
  }}
>
  {graphqlSource}
</GraphQLDocument>
`
