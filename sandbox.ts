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
 * Temporary sandbox for testing
 */

import { analyze } from './src/lib/graphql-document/analysis.ts'

const query = `query GetOrganization {
  organization(reference: { slug: "example" }) {
    id
    name
    slug
    createdAt
  }
}`

const result = analyze(query)
console.log('Analysis result:', {
  identifierCount: result.identifiers.byPosition.size,
  errors: result.errors,
})

console.log('\nIdentifier details:')
Array.from(result.identifiers.byPosition.values()).forEach(id => {
  console.log(`- ${id.name} (${id.kind}) at line ${id.position.line}, column ${id.position.column}`)
})
