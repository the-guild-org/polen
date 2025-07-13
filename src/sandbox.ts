import { buildSchema } from 'graphql'
import { parseGraphQLWithTreeSitter } from './template/components/GraphQLInteractive/lib/parser.js'

const schema = buildSchema(`
  type Pokemon {
    id: ID!
    name: String!
    types: [PokemonType!]!
    abilities: [Ability!]!
  }
  
  type Ability {
    name: String!
    description: String!
  }
  
  enum PokemonType {
    FIRE
    WATER
    GRASS
    ELECTRIC
    PSYCHIC
  }
  
  type Query {
    pokemon(id: ID!): Pokemon
  }
`)

const code = `query GetPokemon($id: ID!) {
  pokemon(id: $id) {
    id
    name
  }
}`

console.log('Testing GraphQL parser...')
const tokens = await parseGraphQLWithTreeSitter(code, [], schema)
console.log('\nTotal tokens:', tokens.length)
console.log('\nInteractive tokens:')
tokens.filter(t => t.polen.isInteractive()).forEach(t => {
  console.log(`- "${t.text}" (${t.highlighter.getCssClass()}) -> ${t.polen.getReferenceUrl()}`)
})
