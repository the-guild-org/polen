# React Examples

Build amazing Pokemon UIs with React and GraphQL.

## Basic Pokemon Card

Display a Pokemon with its basic information:

```jsx
import { gql, useQuery } from '@apollo/client'

const GET_POKEMON = gql`
  query GetPokemon($name: String!) {
    pokemon(name: $name) {
      id
      name
      sprite
      types
      stats {
        hp
        attack
        defense
      }
    }
  }
`

function PokemonCard({ name }) {
  const { loading, error, data } = useQuery(GET_POKEMON, {
    variables: { name },
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const { pokemon } = data

  return (
    <div className='pokemon-card'>
      <img src={pokemon.sprite} alt={pokemon.name} />
      <h2>{pokemon.name}</h2>
      <div className='types'>
        {pokemon.types.map(type => (
          <span key={type} className={`type-${type}`}>
            {type}
          </span>
        ))}
      </div>
      <div className='stats'>
        <div>HP: {pokemon.stats.hp}</div>
        <div>Attack: {pokemon.stats.attack}</div>
        <div>Defense: {pokemon.stats.defense}</div>
      </div>
    </div>
  )
}
```

## Live Pokemon Search

Search for Pokemon in real-time:

```jsx
import { gql, useLazyQuery } from '@apollo/client'
import { useState } from 'react'

const SEARCH_POKEMON = gql`
  query SearchPokemon($query: String!) {
    searchPokemon(query: $query, limit: 10) {
      id
      name
      sprite
      types
    }
  }
`

function PokemonSearch() {
  const [query, setQuery] = useState('')
  const [search, { loading, data }] = useLazyQuery(SEARCH_POKEMON)

  const handleSearch = (e) => {
    const value = e.target.value
    setQuery(value)
    if (value.length > 2) {
      search({ variables: { query: value } })
    }
  }

  return (
    <div>
      <input
        type='text'
        value={query}
        onChange={handleSearch}
        placeholder='Search Pokemon...'
      />
      {loading && <div>Searching...</div>}
      {data && (
        <div className='search-results'>
          {data.searchPokemon.map(pokemon => (
            <PokemonCard key={pokemon.id} pokemon={pokemon} />
          ))}
        </div>
      )}
    </div>
  )
}
```

## Pokemon Team Builder

Create and manage your Pokemon team:

```jsx
const CREATE_TEAM = gql`
  mutation CreateTeam($name: String!, $pokemonIds: [ID!]!) {
    createTeam(name: $name, pokemonIds: $pokemonIds) {
      id
      name
      pokemon {
        id
        name
        sprite
      }
    }
  }
`

function TeamBuilder() {
  const [teamName, setTeamName] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState([])
  const [createTeam] = useMutation(CREATE_TEAM)

  const handleCreateTeam = async () => {
    const { data } = await createTeam({
      variables: {
        name: teamName,
        pokemonIds: selectedPokemon.map(p => p.id),
      },
    })
    console.log('Team created:', data.createTeam)
  }

  return (
    <div>
      <input
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder='Team name'
      />
      <PokemonSelector
        onSelect={(pokemon) => {
          if (selectedPokemon.length < 6) {
            setSelectedPokemon([...selectedPokemon, pokemon])
          }
        }}
      />
      <div className='selected-team'>
        {selectedPokemon.map(pokemon => (
          <div key={pokemon.id}>
            <img src={pokemon.sprite} alt={pokemon.name} />
            <span>{pokemon.name}</span>
          </div>
        ))}
      </div>
      <button onClick={handleCreateTeam}>Create Team</button>
    </div>
  )
}
```
