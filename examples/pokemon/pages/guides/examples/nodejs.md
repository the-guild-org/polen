# Node.js Examples

Server-side Pokemon applications with Node.js.

## Basic GraphQL Client

Set up a GraphQL client for server-side queries:

```javascript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://pokemon-api.example.com/graphql', {
  headers: {
    Authorization: `Bearer ${process.env.POKEMON_API_KEY}`
  }
})

// Fetch a Pokemon
async function getPokemon(name) {
  const query = `
    query GetPokemon($name: String!) {
      pokemon(name: $name) {
        id
        name
        types
        stats {
          hp
          attack
          defense
          speed
        }
      }
    }
  `
  
  const data = await client.request(query, { name })
  return data.pokemon
}
```

## Batch Pokemon Import

Import multiple Pokemon efficiently:

```javascript
import DataLoader from 'dataloader'

// Create a DataLoader for batching
const pokemonLoader = new DataLoader(async (names) => {
  const query = `
    query GetMultiplePokemon($names: [String!]!) {
      pokemons(names: $names) {
        id
        name
        types
        stats {
          hp
          attack
          defense
        }
      }
    }
  `
  
  const { pokemons } = await client.request(query, { names })
  
  // DataLoader expects results in the same order as keys
  return names.map(name => 
    pokemons.find(p => p.name === name)
  )
})

// Usage
async function analyzeTeam(pokemonNames) {
  // These will be batched into a single request
  const pokemons = await Promise.all(
    pokemonNames.map(name => pokemonLoader.load(name))
  )
  
  // Analyze team composition
  const typeCount = {}
  pokemons.forEach(pokemon => {
    pokemon.types.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1
    })
  })
  
  return {
    pokemons,
    typeDistribution: typeCount,
    averageStats: calculateAverageStats(pokemons)
  }
}
```

## Pokemon Data Export

Export Pokemon data for analysis:

```javascript
import fs from 'fs/promises'
import { Parser } from 'json2csv'

async function exportPokemonData(generation) {
  const query = `
    query GetGenerationPokemon($generation: Int!) {
      pokemonByGeneration(generation: $generation) {
        id
        nationalDexNumber
        name
        types
        stats {
          hp
          attack
          defense
          specialAttack
          specialDefense
          speed
        }
        abilities {
          name
          isHidden
        }
      }
    }
  `
  
  const { pokemonByGeneration } = await client.request(query, { generation })
  
  // Flatten data for CSV
  const flatData = pokemonByGeneration.map(pokemon => ({
    id: pokemon.id,
    dexNumber: pokemon.nationalDexNumber,
    name: pokemon.name,
    type1: pokemon.types[0],
    type2: pokemon.types[1] || '',
    hp: pokemon.stats.hp,
    attack: pokemon.stats.attack,
    defense: pokemon.stats.defense,
    spAttack: pokemon.stats.specialAttack,
    spDefense: pokemon.stats.specialDefense,
    speed: pokemon.stats.speed,
    totalStats: Object.values(pokemon.stats).reduce((a, b) => a + b, 0),
    abilities: pokemon.abilities.map(a => a.name).join(', ')
  }))
  
  // Convert to CSV
  const parser = new Parser()
  const csv = parser.parse(flatData)
  
  // Save to file
  await fs.writeFile(`gen${generation}_pokemon.csv`, csv)
  console.log(`Exported ${flatData.length} Pokemon to CSV`)
}
```

## WebSocket Subscriptions

Listen for real-time Pokemon events:

```javascript
import { createClient } from 'graphql-ws'
import WebSocket from 'ws'

const wsClient = createClient({
  url: 'wss://pokemon-api.example.com/graphql',
  webSocketImpl: WebSocket,
  connectionParams: {
    authorization: `Bearer ${process.env.POKEMON_API_KEY}`
  }
})

// Subscribe to wild Pokemon sightings
function subscribeToWildPokemon(latitude, longitude) {
  const subscription = `
    subscription WildPokemonNearby($lat: Float!, $lng: Float!) {
      wildPokemonNearby(lat: $lat, lng: $lng, radiusKm: 5) {
        pokemon {
          id
          name
          rarity
        }
        location {
          latitude
          longitude
        }
        expiresAt
      }
    }
  `
  
  return wsClient.subscribe(
    {
      query: subscription,
      variables: { lat: latitude, lng: longitude }
    },
    {
      next: (data) => {
        console.log('Wild Pokemon appeared:', data.wildPokemonNearby)
        // Send notification, update database, etc.
      },
      error: (err) => console.error('Subscription error:', err),
      complete: () => console.log('Subscription complete')
    }
  )
}
```