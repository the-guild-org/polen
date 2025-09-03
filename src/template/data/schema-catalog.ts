import { Catalog } from '#lib/catalog/$'
import { Effect } from 'effect'
import schemaCatalogEncoded from 'virtual:polen/project/schema.json'

export const schemaCatalog: Catalog.Catalog | null = schemaCatalogEncoded
  ? Effect.runSync(Catalog.decode(schemaCatalogEncoded as any))
  : null
