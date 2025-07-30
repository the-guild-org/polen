import { buildSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { parseGraphQLWithTreeSitter } from '../lib/parser.js'
import { isInvalidField } from '../lib/semantic-nodes.js'

describe('parseGraphQLWithTreeSitter - error hints', () => {
  test('should create error hint tokens after invalid fields', async () => {
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
      pokemon(id: "123") {
        id
        name
        invalidField
      }
    }`

    const tokens = await parseGraphQLWithTreeSitter(code, [], schema)

    // Find the invalid field token
    const invalidToken = tokens.find(t =>
      t.text === 'invalidField'
      && isInvalidField(t.semantic)
    )

    expect(invalidToken).toBeDefined()

    // Find the error hint token that follows the invalid field
    const invalidTokenIndex = tokens.indexOf(invalidToken!)
    const errorHintToken = tokens[invalidTokenIndex + 1]

    expect(errorHintToken).toBeDefined()
    expect(errorHintToken?.text).toBe(' ← No such field')
    expect(errorHintToken?.highlighter.getCssClass()).toBe('graphql-error-hint')
  })

  test('should place error hint after arguments for invalid fields with args', async () => {
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
      invalidField(limit: 10, offset: 20) {
        id
      }
    }`

    const tokens = await parseGraphQLWithTreeSitter(code, [], schema)

    // Find the closing parenthesis
    const closingParenIndex = tokens.findIndex(t => t.text === ')' && t.start > 35)
    expect(closingParenIndex).toBeGreaterThan(-1)

    // The error hint should come after the closing parenthesis
    const errorHintToken = tokens[closingParenIndex + 1]
    expect(errorHintToken?.highlighter.getCssClass()).toBe('graphql-error-hint')
    expect(errorHintToken?.text).toBe(' ← No such field')
  })

  test('should not create error hint tokens for valid fields', async () => {
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
      pokemon(id: "123") {
        id
        name
      }
    }`

    const tokens = await parseGraphQLWithTreeSitter(code, [], schema)

    // Check that no error hint tokens were created
    const errorHintTokens = tokens.filter(t => t.highlighter.getCssClass() === 'graphql-error-hint')

    expect(errorHintTokens.length).toBe(0)
  })
})
