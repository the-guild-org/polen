import { readFileSync } from 'fs'
import { buildSchema } from 'graphql'
import { Polen } from 'polen'
import { createPolenRehypePlugin } from 'polen/lib/graphql-document'

// Load the Hive schema
const schemaContent = readFileSync('./schema.graphql', 'utf-8')
const schema = buildSchema(schemaContent)

export default Polen.defineConfig({
  templateVariables: {
    title: `Hive API`,
  },
  // Add MDX configuration to enable interactive GraphQL blocks
  mdx: {
    rehypePlugins: [
      // Add our GraphQL document plugin
      createPolenRehypePlugin({
        schema,
        validateAtBuildTime: true,
        referencePath: '/reference',
      }),
    ],
  },
})
