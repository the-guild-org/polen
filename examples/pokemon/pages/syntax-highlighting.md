# Syntax Highlighting Demo

This page demonstrates the new syntax highlighting features in Polen.

## TypeScript with Type Annotations

```typescript
interface Pokemon {
  id: number
  name: string
  types: PokemonType[]
  stats: {
    hp: number
    attack: number
    defense: number
  }
}

async function fetchPokemon(id: number): Promise<Pokemon> {
  const response = await fetch(`/api/pokemon/${id}`)
  if (!response.ok) {
    throw new Error(`Pokemon not found`)
  }
  return response.json()
}

// Usage with async/await
try {
  const pikachu = await fetchPokemon(25)
  console.log(`${pikachu.name} has ${pikachu.stats.hp} HP`)
} catch (error) {
  console.error('Failed to fetch Pokemon:', error)
}
```

## GraphQL Schema

```graphql
type Pokemon {
  id: ID!
  name: String!
  types: [PokemonType!]!
  stats: PokemonStats!
  evolutions: [Pokemon!]!
  abilities: [Ability!]!
}

type PokemonType {
  id: ID!
  name: String!
  effectiveness: TypeEffectiveness!
}

type PokemonStats {
  hp: Int!
  attack: Int!
  defense: Int!
  specialAttack: Int!
  specialDefense: Int!
  speed: Int!
}

type Query {
  pokemon(id: ID!): Pokemon
  pokemons(limit: Int = 20, offset: Int = 0): [Pokemon!]!
  searchPokemon(name: String!): [Pokemon!]!
}

type Mutation {
  catchPokemon(trainerId: ID!, pokemonId: ID!): CatchResult!
  releasePokemon(trainerId: ID!, pokemonId: ID!): Boolean!
}
```

## React Component Example

```tsx
import React, { useEffect, useState } from 'react'
import { usePokemonQuery } from './generated/graphql'

interface PokemonCardProps {
  pokemonId: number
  onSelect?: (pokemon: Pokemon) => void
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemonId,
  onSelect,
}) => {
  const [isShiny, setIsShiny] = useState(false)
  const { data, loading, error } = usePokemonQuery({
    variables: { id: pokemonId },
  })

  if (loading) return <div className='pokemon-card loading'>Loading...</div>
  if (error) {
    return <div className='pokemon-card error'>Error loading Pokemon</div>
  }
  if (!data?.pokemon) return null

  const { pokemon } = data

  return (
    <div
      className={`pokemon-card ${isShiny ? 'shiny' : ''}`}
      onClick={() => onSelect?.(pokemon)}
    >
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        onDoubleClick={() => setIsShiny(!isShiny)}
      />
      <h3>{pokemon.name}</h3>
      <div className='types'>
        {pokemon.types.map(type => (
          <span key={type.id} className={`type ${type.name}`}>
            {type.name}
          </span>
        ))}
      </div>
    </div>
  )
}
```

## JSON Configuration

```json
{
  "name": "pokemon-portal",
  "version": "1.0.0",
  "description": "A GraphQL portal for Pokemon data",
  "config": {
    "api": {
      "endpoint": "https://pokeapi.co/graphql",
      "headers": {
        "X-API-Key": "${POKEMON_API_KEY}"
      }
    },
    "features": {
      "search": true,
      "filters": ["type", "generation", "stats"],
      "pagination": {
        "defaultLimit": 20,
        "maxLimit": 100
      }
    }
  }
}
```

## Shell Commands

```bash
# Install Polen and dependencies
npm install -D polen graphql

# Generate GraphQL types
npx polen generate

# Start development server
npx polen dev --port 3000

# Build for production
npx polen build --minify

# Deploy to production
npx polen deploy --env production
```

## CSS Styling

```css
/* Pokemon card styles */
.pokemon-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.pokemon-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.pokemon-card.shiny {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.pokemon-card .types {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.pokemon-card .type {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Type colors */
.type.electric { background: #f7c545; color: #3a3a3a; }
.type.water { background: #6390f0; color: white; }
.type.fire { background: #ee8130; color: white; }
.type.grass { background: #7ac74c; color: white; }
```

## YAML Configuration

```yaml
# Polen configuration
project:
  name: Pokemon GraphQL Portal
  version: 1.0.0
  
schema:
  source: ./schema.graphql
  
pages:
  - index.md
  - guides/
    - getting-started.md
    - advanced-queries.md
  - reference/
    - types.md
    - queries.md
    - mutations.md

theme:
  primaryColor: '#ee8130'
  fontFamily: 'Inter, system-ui, sans-serif'
  codeTheme: 'tokyo-night'
  
build:
  output: dist
  minify: true
  sourcemaps: false
```

This page showcases syntax highlighting for multiple languages commonly used in GraphQL development!
