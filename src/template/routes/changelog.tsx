import { superjson } from '#singletons/superjson'
import SCHEMA from 'virtual:polen/project/data/schema.jsonsuper'
import { ComponentChangelogClient } from './changelog.client.js'

export async function Component() {
  const schema = SCHEMA

  if (!schema) {
    return <div>No data to show. There is no schema.</div>
  }

  const serializedSchema = superjson.serialize(schema)
  return <ComponentChangelogClient serializedSchema={serializedSchema} />
}
