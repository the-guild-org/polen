//
//
//
//
//
// Temporary Work File
//
// ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//
// – Use freely
// – Try to remember to not commit changes
// – Included by development TypeScript configuration
// – Excluded by build TypeScript configuration
//
//

/**
 * Manual test for GraphQL document hover tooltips
 */

import { buildSchema } from 'graphql'
import { analyzeWithSchema } from './src/lib/graphql-document/schema-integration.ts'

const schema = buildSchema(`
  type Query {
    user(id: ID!): User
    posts(limit: Int = 10): [Post!]!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    
    # Deprecated field for testing
    oldField: String @deprecated(reason: "Use 'name' instead")
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
  }
`)

const testQuery = `
query GetUserPosts($userId: ID!) {
  user(id: $userId) {
    id
    name
    email
    oldField  # This should show deprecated warning
    posts {
      title
      content
    }
  }
  
  # This should show as an error
  nonExistentField
  
  posts(limit: 5) {
    id
    title
    author {
      name
    }
  }
}
`

console.log('Testing GraphQL document analysis...\n')

const { analysis, resolutions } = analyzeWithSchema(testQuery, schema)

console.log('Found identifiers:')
analysis.identifiers.all.forEach(id => {
  const key = `${id.position.start}-${id.name}-${id.kind}`
  const resolution = resolutions.get(key)
  console.log(
    `- ${id.kind} "${id.name}" at line ${id.position.line}:${id.position.column}`,
    resolution?.exists ? '✓' : '✗',
    resolution?.deprecated ? '(deprecated)' : '',
  )
})

console.log('\nErrors:', analysis.errors)
console.log('\nTo test the UI, run: pnpm dev')
