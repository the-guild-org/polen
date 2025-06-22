---
description: Learn the fundamentals of GraphQL including queries, mutations, and subscriptions with practical Pokemon examples
---

# GraphQL Basics

This guide introduces the fundamental concepts of GraphQL using our Pokemon API as examples.

## What is GraphQL?

GraphQL is a query language for APIs that allows clients to request exactly what data they need. Unlike REST APIs, GraphQL provides:

- **Single endpoint** - All requests go to one URL
- **Precise data fetching** - Get only the fields you need
- **Type safety** - Strongly typed schema
- **Self-documenting** - Built-in introspection

## Basic Query

Here's a simple query to get a Pokemon's name and type:

```graphql
query GetPikachu {
  pokemon(name: "Pikachu") {
    name
    types
  }
}
```

## Variables

Use variables to make queries reusable:

```graphql
query GetPokemon($name: String!) {
  pokemon(name: $name) {
    id
    name
    types
    weight
    height
  }
}
```

## Nested Data

GraphQL excels at fetching related data in one request:

```graphql
query GetPokemonWithEvolutions {
  pokemon(name: "Charmander") {
    name
    evolutions {
      name
      types
      evolutions {
        name
        types
      }
    }
  }
}
```

## Next Steps

- Explore the [Schema Reference](/schema) to see all available types and fields
- Try queries in the [GraphQL Playground](/playground)
- Learn about [Advanced Queries](/guides/advanced-queries)
