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
 * Debug Interactive GraphQL Features with CodeHike
 */

import { buildSchema, printSchema } from 'graphql'

// Create a simple test schema
const schema = buildSchema(`
  type Query {
    """The currently authenticated user"""
    me: User
    """Fetch a user by ID"""
    user(id: ID!): User
  }

  """A user in the system"""
  type User {
    """Unique identifier"""
    id: ID!
    """Display name"""
    name: String!
    """Email address"""
    email: String!
  }
`)

console.log(`Test Schema:`)
console.log(printSchema(schema))

// Check if the schema is being properly passed to components
console.log(`\nChecking window.__POLEN_GRAPHQL_SCHEMA__:`)
console.log(`- Should be set in root.tsx when schema exists`)
console.log(`- Used by CodeBlock.tsx and CodeHikePre.tsx for interactive blocks`)

// The interactive feature flow:
console.log(`\nInteractive GraphQL Flow:`)
console.log(`1. MDX file contains: \`\`\`graphql interactive`)
console.log(`2. CodeHike processes and passes to CodeBlock or Pre component`)
console.log(`3. Component checks for lang='graphql' and meta includes 'interactive'`)
console.log(`4. GraphQLDocument component wraps the code with interactive features`)
console.log(`5. Schema from window.__POLEN_GRAPHQL_SCHEMA__ enables tooltips/links`)
