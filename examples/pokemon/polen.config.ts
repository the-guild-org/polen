import { defineConfig } from 'polen/polen'

export default defineConfig({
  name: 'Pokemon API',
  schema: {
    useSources: ['versionedDirectory'],
    sources: {
      versionedDirectory: {
        path: './schema',
      },
    },
  },
})
