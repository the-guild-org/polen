import { superjson } from '#singletons/superjson'
import SCHEMA from 'virtual:polen/project/data/schema.jsonsuper'
import { MissingSchema } from '../components/MissingSchema.js'
import { ComponentReferenceTypeFieldClient } from './reference.$type.$field.client.js'

export async function Component({ params }: { params: { type: string; field: string } }) {
  const typeParam = params.type
  const fieldParam = params.field

  const latestSchemaVersion = SCHEMA?.versions[0].after ?? null
  if (!latestSchemaVersion) {
    return <MissingSchema />
  }

  const serializedSchema = superjson.serialize(latestSchemaVersion)
  return <ComponentReferenceTypeFieldClient 
    serializedSchema={serializedSchema} 
    typeParam={typeParam} 
    fieldParam={fieldParam} 
  />
}
