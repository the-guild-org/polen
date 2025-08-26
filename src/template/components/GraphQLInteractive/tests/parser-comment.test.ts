import { buildSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { parseGraphQLWithTreeSitter } from '../lib/parser.js'

describe('parseGraphQLWithTreeSitter - comments', () => {
  test('should recognize comments and apply correct styling class', async () => {
    const schema = buildSchema(`
      type Query {
        pokemon(id: ID!): Pokemon
      }
      
      type Pokemon {
        id: ID!
        name: String!
      }
    `)

    const code = `query {
      pokemon(id: "025") {
        id
        name  # This is a comment
      }
    }`

    const tokens = await parseGraphQLWithTreeSitter(code, [], schema)

    // Find the comment token
    const commentToken = tokens.find(t => t.text.startsWith('#') && t.text.includes('comment'))

    expect(commentToken).toBeDefined()
    expect(commentToken?.highlighter.getCssClass()).toBe('graphql-comment')
  })
})
