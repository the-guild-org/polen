import { buildSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { parseGraphQLWithTreeSitter } from '../lib/parser.js'
import { isArgument } from '../lib/semantic-nodes.js'

describe('parseGraphQLWithTreeSitter', () => {
  describe('argument parsing', () => {
    test('should recognize argument names as interactive tokens', async () => {
      const schema = buildSchema(`
        type Query {
          pokemon(id: ID!): String
        }
      `)

      const code = `query {
        pokemon(id: "123") {
          __typename
        }
      }`

      const tokens = await parseGraphQLWithTreeSitter(code, [], schema)

      // Find the argument "id" token
      const argumentToken = tokens.find(t =>
        t.text === 'id'
        && isArgument(t.semantic)
      )

      expect(argumentToken).toBeDefined()
      expect(argumentToken?.polen.isInteractive()).toBe(true)
      expect(argumentToken?.polen.getReferenceUrl()).toBe('/reference/Query#pokemon__id')
    })

    test('should handle multiple arguments', async () => {
      const schema = buildSchema(`
        type Query {
          search(query: String!, limit: Int, offset: Int): [String!]!
        }
      `)

      const code = `query {
        search(query: "test", limit: 10) {
          __typename
        }
      }`

      const tokens = await parseGraphQLWithTreeSitter(code, [], schema)

      const queryArg = tokens.find(t => t.text === 'query' && isArgument(t.semantic))
      const limitArg = tokens.find(t => t.text === 'limit' && isArgument(t.semantic))

      expect(queryArg).toBeDefined()
      expect(queryArg?.polen.isInteractive()).toBe(true)
      expect(queryArg?.polen.getReferenceUrl()).toBe('/reference/Query#search__query')

      expect(limitArg).toBeDefined()
      expect(limitArg?.polen.isInteractive()).toBe(true)
      expect(limitArg?.polen.getReferenceUrl()).toBe('/reference/Query#search__limit')
    })

    test('should handle arguments with variables', async () => {
      const schema = buildSchema(`
        type Query {
          pokemon(id: ID!): String
        }
      `)

      const code = `query GetPokemon($pokemonId: ID!) {
        pokemon(id: $pokemonId) {
          __typename
        }
      }`

      const tokens = await parseGraphQLWithTreeSitter(code, [], schema)

      // The argument name "id" should still be recognized even when value is a variable
      const idArgument = tokens.find(t =>
        t.text === 'id'
        && isArgument(t.semantic)
      )

      expect(idArgument).toBeDefined()
      expect(idArgument?.polen.isInteractive()).toBe(true)

      // Variable tokens - basic implementation completed
      const variable = tokens.find(t => t.text === '$pokemonId')
      if (variable && variable.semantic && 'kind' in variable.semantic) {
        expect(variable.semantic.kind).toBe('Variable')
      }
    })
  })

  describe('field parsing', () => {
    test('should recognize fields as interactive', async () => {
      const schema = buildSchema(`
        type Pokemon {
          id: ID!
          name: String!
        }
        
        type Query {
          pokemon: Pokemon
        }
      `)

      const code = `query {
        pokemon {
          id
          name
        }
      }`

      const tokens = await parseGraphQLWithTreeSitter(code, [], schema)

      const pokemonField = tokens.find(t =>
        t.text === 'pokemon' && t.semantic && 'kind' in t.semantic && t.semantic.kind === 'OutputField'
      )
      const idField = tokens.find(t =>
        t.text === 'id' && t.semantic && 'kind' in t.semantic && t.semantic.kind === 'OutputField'
      )

      expect(pokemonField).toBeDefined()
      expect(pokemonField?.polen.isInteractive()).toBe(true)
      expect(pokemonField?.polen.getReferenceUrl()).toBe('/reference/Query#pokemon')

      expect(idField).toBeDefined()
      expect(idField?.polen.isInteractive()).toBe(true)
      expect(idField?.polen.getReferenceUrl()).toBe('/reference/Pokemon#id')
    })
  })
})
