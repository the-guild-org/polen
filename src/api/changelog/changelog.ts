import type { GraphqlChangeset } from '#lib/graphql-changeset/index.js'

export * as DataSources from './data-sources/data-sources.js'

export interface Changelog {
  changesets: GraphqlChangeset.ChangeSet[]
}
