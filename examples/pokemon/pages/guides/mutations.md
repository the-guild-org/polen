# Mutations

Learn how to modify data using GraphQL mutations.

## Catching Pokemon

Use the `catchPokemon` mutation to add a Pokemon to your collection:

```graphql
mutation CatchPokemon($pokemonId: ID!, $nickname: String) {
  catchPokemon(pokemonId: $pokemonId, nickname: $nickname) {
    id
    pokemon {
      name
      types
    }
    nickname
    caughtAt
  }
}
```

## Evolving Pokemon

Evolve your Pokemon when they're ready:

```graphql
mutation EvolvePokemon($caughtPokemonId: ID!) {
  evolvePokemon(id: $caughtPokemonId) {
    id
    pokemon {
      id
      name
      evolutionChain {
        name
      }
    }
  }
}
```

## Trading Pokemon

Trade with other trainers:

```graphql
mutation TradePokemon($myPokemonId: ID!, $theirPokemonId: ID!, $trainerId: ID!) {
  tradePokemon(
    myPokemonId: $myPokemonId
    theirPokemonId: $theirPokemonId
    trainerId: $trainerId
  ) {
    success
    message
    tradedPokemon {
      id
      nickname
    }
  }
}
```
