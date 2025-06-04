# Performance Optimization

Optimize your Pokemon API queries for maximum performance.

## Query Complexity Analysis

Understanding query complexity:

```graphql
# ❌ Expensive query - high complexity
query ExpensiveQuery {
  allPokemon {  # 1000+ items
    id
    name
    evolutions {  # N+1 queries
      id
      name
      evolutions {  # Nested N+1
        id
        name
      }
    }
    moves {  # 100+ items per Pokemon
      id
      name
      power
      accuracy
    }
  }
}

# ✅ Optimized query - controlled complexity
query OptimizedQuery {
  pokemon(limit: 20, offset: 0) {
    id
    name
    types
    sprite
  }
}
```

## Field-Level Caching

Implement smart caching strategies:

```javascript
const cache = new InMemoryCache({
  typePolicies: {
    Pokemon: {
      fields: {
        // Cache computed fields
        effectiveness: {
          read(existing, { readField }) {
            if (existing) return existing

            const types = readField('types')
            return calculateTypeEffectiveness(types)
          },
        },
        // Cache expensive calculations
        battlePower: {
          read(existing, { readField }) {
            if (existing) return existing

            const stats = readField('stats')
            const moves = readField('moves')
            return calculateBattlePower(stats, moves)
          },
        },
      },
    },
  },
})
```

## Query Batching

Batch multiple queries efficiently:

```javascript
import { BatchHttpLink } from '@apollo/client/link/batch-http'

const link = new BatchHttpLink({
  uri: 'https://pokemon-api.example.com/graphql',
  batchMax: 5, // Max 5 queries per batch
  batchInterval: 20, // Wait 20ms to batch queries
})

// These queries will be batched
async function loadPokemonData() {
  const results = await Promise.all([
    client.query({ query: GET_PIKACHU }),
    client.query({ query: GET_CHARIZARD }),
    client.query({ query: GET_BLASTOISE }),
  ])

  return results.map(r => r.data.pokemon)
}
```

## Persisted Queries

Use persisted queries for production:

```javascript
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries'
import { sha256 } from 'crypto-hash'

const link = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true,
})

// First request sends query + hash
// Subsequent requests only send hash
const GET_POKEMON = gql`
  query GetPokemon($id: ID!) {
    pokemon(id: $id) {
      id
      name
      sprite
    }
  }
`
```

## Database Query Optimization

Optimize resolver performance:

```javascript
// ❌ N+1 query problem
const resolvers = {
  Pokemon: {
    evolutions: async (parent) => {
      // Separate query for each Pokemon
      return db.query('SELECT * FROM pokemon WHERE evolves_from = ?', [
        parent.id,
      ])
    },
  },
}

// ✅ DataLoader solution
const evolutionLoader = new DataLoader(async (pokemonIds) => {
  const evolutions = await db.query(
    'SELECT * FROM pokemon WHERE evolves_from IN (?)',
    [pokemonIds],
  )

  // Group by parent ID
  const grouped = {}
  evolutions.forEach(evo => {
    if (!grouped[evo.evolves_from]) {
      grouped[evo.evolves_from] = []
    }
    grouped[evo.evolves_from].push(evo)
  })

  // Return in same order as input
  return pokemonIds.map(id => grouped[id] || [])
})

const optimizedResolvers = {
  Pokemon: {
    evolutions: (parent) => evolutionLoader.load(parent.id),
  },
}
```

## Response Compression

Enable compression for large responses:

```javascript
import compression from 'compression'

app.use(compression({
  filter: (req, res) => {
    // Compress responses > 1KB
    return compression.filter(req, res)
  },
  threshold: 1024,
}))
```

## Monitoring & Metrics

Track performance metrics:

```javascript
import { ApolloServerPlugin } from '@apollo/server'

const performancePlugin: ApolloServerPlugin = {
  async requestDidStart() {
    const start = Date.now()
    
    return {
      async willSendResponse(requestContext) {
        const duration = Date.now() - start
        const complexity = calculateQueryComplexity(requestContext.document)
        
        // Log metrics
        console.log({
          query: requestContext.request.query,
          duration,
          complexity,
          cacheHits: requestContext.metrics?.cacheHits,
          errors: requestContext.errors?.length || 0
        })
        
        // Send to monitoring service
        metrics.record({
          queryDuration: duration,
          queryComplexity: complexity
        })
      }
    }
  }
}
```
