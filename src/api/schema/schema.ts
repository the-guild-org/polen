import type { GraphqlChangeset } from '#lib/graphql-changeset/index'

export * as DataSources from './data-sources/data-sources.js'

export * from './read.js'

export interface Schema {
  versions: [GraphqlChangeset.ChangeSet, ...GraphqlChangeset.ChangeSet[]]
}
