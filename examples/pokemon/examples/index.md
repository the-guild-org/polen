# Pokemon GraphQL Examples

Welcome to the Pokemon GraphQL API examples! This collection demonstrates various queries you can make to explore Pokemon data.

## Available Examples

Browse through our examples using the sidebar on the left. Each example showcases different aspects of the GraphQL API:

- **Get Pokemon** - Fetch details about a specific Pokemon by name or ID
- **List Pokemons** - Query multiple Pokemon with pagination support
- **Search Pokemon** - Search for Pokemon using various filters

## Interactive Code Blocks

All examples feature interactive GraphQL code blocks where you can:

- Edit queries in real-time
- See syntax highlighting and auto-completion
- View query results instantly

## Getting Started

Here's a simple query to get you started:

```graphql interactive
query GetPikachu {
  pokemon(name: "pikachu") {
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
```

{/* once they are runnable and editable ... */}
{/_Feel free to modify the query above and explore the API!_/}

## Learn More

For more information about the Pokemon GraphQL API, check out the [API Reference](/reference) section.
