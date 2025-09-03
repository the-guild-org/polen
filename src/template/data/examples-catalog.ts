import * as Catalog from '#api/examples/schemas/catalog'
import { Effect } from 'effect'
import { examplesCatalog as examplesCatalogData } from 'virtual:polen/project/examples'

// The examples catalog comes from the virtual module as encoded JSON data and needs to be decoded
export const examplesCatalog = Effect.runSync(Catalog.decode(examplesCatalogData))