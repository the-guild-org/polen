import SCHEMA from 'virtual:polen/project/data/schema.jsonsuper'
import { MissingSchema } from '../components/MissingSchema.js'
import { ComponentReferenceClient } from './reference.client.js'

export async function Component() {
  const latestSchemaVersion = SCHEMA?.versions[0].after ?? null

  if (!latestSchemaVersion) {
    return <MissingSchema />
  }

  return <ComponentReferenceClient />
}
