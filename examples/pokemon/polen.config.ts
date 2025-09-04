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
    topics: ['adventure', 'pokemon', 'wilderness', 'battles'],
    hero: {
      prompt: 'hero image for pokemon platform allowing exploration and capture of wild pokemon.',
      layout: 'cinematic',
    },
    examples: {
      title: 'API Examples',
      description: 'Explore common queries with version-specific variations',
      only: ['get-pokemon', 'list-pokemons', 'search-pokemon'],
      maxExamples: 3,
    },
  },
})
