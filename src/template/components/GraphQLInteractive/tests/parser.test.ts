import { Test } from '@wollybeard/kit/test'
import { buildSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { parseGraphQLWithTreeSitter } from '../lib/parser.js'
import { isArgument } from '../lib/semantic-nodes.js'

describe('parseGraphQLWithTreeSitter', () => {
  interface ArgumentParsingCase {
    schemaSDL: string
    code: string
    checks: Array<{
      tokenText: string
      isArgument: boolean
      expectedInteractive?: boolean
      expectedUrl?: string
      checkVariable?: boolean
    }>
  }

  type ArgumentParsingInput = ArgumentParsingCase
  type ArgumentParsingOutput = {}

  // dprint-ignore
  Test.Table.suite<ArgumentParsingInput, ArgumentParsingOutput>('argument parsing', [
    {
      n: 'should recognize argument names as interactive tokens',
      i: {
        schemaSDL: `
        type Query {
          pokemon(id: ID!): String
        }
      `,
        code: `query {
        pokemon(id: "123") {
          __typename
        }
      }`,
        checks: [
          { tokenText: 'id', isArgument: true, expectedInteractive: true, expectedUrl: '/reference/Query#pokemon__id' },
        ],
      },
      o: {}
    },
    {
      n: 'should handle multiple arguments',
      i: {
        schemaSDL: `
        type Query {
          search(query: String!, limit: Int, offset: Int): [String!]!
        }
      `,
        code: `query {
        search(query: "test", limit: 10) {
          __typename
        }
      }`,
        checks: [
          { tokenText: 'query', isArgument: true, expectedInteractive: true, expectedUrl: '/reference/Query#search__query' },
          { tokenText: 'limit', isArgument: true, expectedInteractive: true, expectedUrl: '/reference/Query#search__limit' },
        ],
      },
      o: {}
    },
    {
      n: 'should handle arguments with variables',
      i: {
        schemaSDL: `
        type Query {
          pokemon(id: ID!): String
        }
      `,
        code: `query GetPokemon($pokemonId: ID!) {
        pokemon(id: $pokemonId) {
          __typename
        }
      }`,
        checks: [
          { tokenText: 'id', isArgument: true, expectedInteractive: true },
          { tokenText: '$pokemonId', isArgument: false, checkVariable: true },
        ],
      },
      o: {}
    },
  ], async ({ i, o }) => {
    const schema = buildSchema(i.schemaSDL)
    const tokens = await parseGraphQLWithTreeSitter(i.code, [], schema)

    for (const check of i.checks) {
      const token = tokens.find(t => {
        if (check.isArgument) {
          return t.text === check.tokenText && isArgument(t.semantic)
        }
        return t.text === check.tokenText
      })

      if (check.isArgument || check.expectedInteractive !== undefined || check.expectedUrl) {
        expect(token).toBeDefined()
      }

      if (token) {
        if (check.expectedInteractive !== undefined) {
          expect(token.polen.isInteractive()).toBe(check.expectedInteractive)
        }

        if (check.expectedUrl) {
          expect(token.polen.getReferenceUrl()).toBe(check.expectedUrl)
        }

        if (check.checkVariable && token.semantic && 'kind' in token.semantic) {
          expect(token.semantic.kind).toBe('Variable')
        }
      }
    }
  })

  describe('field parsing', () => {
    test('should recognize fields as interactive', async () => {
      const schema = buildSchema(`
        type Pokemon {
          id: ID!
          n: String!
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
