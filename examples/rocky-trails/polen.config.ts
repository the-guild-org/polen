import { defineConfig } from 'polen/polen'

export default defineConfig({
  name: 'Rocky Mountain Trails API',
  schema: {
    useSources: ['directory'],
    sources: {
      directory: {
        path: './schema',
      },
    },
  },
})
