import { defineConfig } from 'polen/polen'

export default defineConfig({
  name: 'Pokemon API',
  description: 'Catch, train, and battle with Pokemon through our comprehensive GraphQL API',
  schema: {
    useSources: ['versionedDirectory'],
    sources: {
      versionedDirectory: {
        path: './schema',
      },
    },
  },
  home: {
    examples: {
      title: 'API Examples',
      description: 'Explore common queries with version-specific variations',
      only: ['get-pokemon', 'list-pokemons', 'search-pokemon'],
      maxExamples: 3,
    },
  },
})
