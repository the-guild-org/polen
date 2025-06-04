# Subscriptions

Real-time updates with GraphQL subscriptions.

## Wild Pokemon Sightings

Get notified when wild Pokemon appear in your area:

```graphql
subscription WildPokemonNearby($latitude: Float!, $longitude: Float!, $radius: Int!) {
  wildPokemonNearby(lat: $latitude, lng: $longitude, radiusKm: $radius) {
    pokemon {
      id
      name
      types
      rarity
    }
    location {
      latitude
      longitude
    }
    expiresAt
  }
}
```

## Battle Updates

Follow live battle updates:

```graphql
subscription BattleUpdates($battleId: ID!) {
  battleUpdates(battleId: $battleId) {
    type
    timestamp
    data {
      ... on MoveUsed {
        pokemon {
          name
        }
        move {
          name
          damage
        }
      }
      ... on PokemonFainted {
        pokemon {
          name
        }
      }
    }
  }
}
```

## Trading Requests

Get notified of incoming trade requests:

```graphql
subscription TradeRequests {
  tradeRequests {
    id
    from {
      id
      username
    }
    offeredPokemon {
      name
      level
    }
    requestedPokemon {
      name
    }
  }
}
```