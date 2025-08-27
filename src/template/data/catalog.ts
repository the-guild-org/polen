import { Catalog } from '#lib/catalog/$'
import { Effect } from 'effect'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.json'

export const catalog: Catalog.Catalog | null = PROJECT_SCHEMA
  ? Effect.runSync(Catalog.decode(PROJECT_SCHEMA as any))
  : null
