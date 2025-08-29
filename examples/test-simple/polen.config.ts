import { defineConfig } from 'polen/polen'

export default defineConfig({
  name: 'Test Simple',
  schema: {
    useSources: ['file'],
    sources: {
      file: {
        path: './schema.graphql',
      },
    },
  },
})
