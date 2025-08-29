import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    sources: {
      file: {
        path: './schema.graphql',
      },
    },
  },
})
