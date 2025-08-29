import { buildSchema } from 'graphql'
import { defineConfig } from 'polen/polen'

const schema = buildSchema(`
  type Query {
    hello: String!
    pokemon(id: ID!): Pokemon
  }

  type Pokemon {
    id: ID!
    name: String!
    type: String!
  }
`)

export default defineConfig({
  name: 'Test Memory',
  schema: {
    useSources: ['memory'],
    sources: {
      memory: {
        versions: [{
          schema,
          date: '2024-01-01',
        }],
      },
    },
  },
})
