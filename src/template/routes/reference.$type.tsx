import { superjson } from '#singletons/superjson'
import SCHEMA from 'virtual:polen/project/data/schema.jsonsuper'
import { MissingSchema } from '../components/MissingSchema.js'
import { ComponentReferenceTypeClient } from './reference.$type.client.js'

export async function Component({ params }: { params: { type: string } }) {
  const typeParam = params.type

  const latestSchemaVersion = SCHEMA?.versions[0].after ?? null
  if (!latestSchemaVersion) {
    return <MissingSchema />
  }

  const serializedSchema = superjson.serialize(latestSchemaVersion)
  return <ComponentReferenceTypeClient serializedSchema={serializedSchema} typeParam={typeParam} />
}
