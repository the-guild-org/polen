import { defineConfig } from 'polen/polen'

export default defineConfig({
  name: 'Test Unversioned',
  schema: {
    useSources: ['directory'],
    sources: {
      directory: {
        path: './schema',
      },
    },
  },
})
