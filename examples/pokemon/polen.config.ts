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
})
