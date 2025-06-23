import { Polen } from 'polen'

export default Polen.defineConfig({
  templateVariables: {
    title: `Hive API`,
  },
  schema: {
    sources: ['./schema.graphql'],
  },
})
