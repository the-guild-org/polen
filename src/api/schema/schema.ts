import type { GraphqlChangeset } from '#lib/graphql-changeset'

export * as DataSources from './data-sources/data-sources.ts'

export * from './read.ts'

export interface Schema {
  versions: [GraphqlChangeset.ChangeSet, ...GraphqlChangeset.ChangeSet[]]
}
