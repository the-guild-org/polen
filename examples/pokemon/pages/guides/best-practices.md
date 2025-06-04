# Best Practices

Tips for building efficient Pokemon applications.

## Query Optimization

### Use Fragments

Reuse common field selections:

```graphql
fragment PokemonBasics on Pokemon {
  id
  name
  types
  sprite
}

query GetTeam {
  myTeam {
    ...PokemonBasics
    level
    stats {
      hp
      attack
      defense
    }
  }
}
```

### Request Only What You Need

Avoid over-fetching:

```graphql
# ❌ Bad - fetches everything
query {
  pokemon(id: "25") {
    id
    name
    height
    weight
    types
    abilities
    stats
    moves
    evolutionChain
    locations
    # ... many more fields
  }
}

# ✅ Good - fetches only needed data
query {
  pokemon(id: "25") {
    id
    name
    types
    sprite
  }
}
```

## Caching Strategies

### Static Data

Cache Pokemon species data aggressively:

```javascript
const client = new GraphQLClient({
  cache: new InMemoryCache({
    typePolicies: {
      Pokemon: {
        keyFields: ['id'],
        fields: {
          // Species data rarely changes
          name: { read: cachedField },
          types: { read: cachedField },
          evolutionChain: { read: cachedField },
        },
      },
    },
  }),
})
```

### Dynamic Data

Use shorter cache times for battle-related data:

```javascript
const CACHE_TIMES = {
  pokemon: 24 * 60 * 60 * 1000, // 24 hours
  trainer: 60 * 60 * 1000, // 1 hour
  battle: 0, // No cache
}
```

## Performance Tips

1. **Batch Requests** - Use DataLoader pattern
2. **Pagination** - Fetch large collections in chunks
3. **Prefetch** - Load data before it's needed
4. **Optimize Images** - Use appropriate sprite sizes

## Security Considerations

- Never expose sensitive data in queries
- Validate all user inputs
- Use HTTPS for all API calls
- Implement proper authentication
