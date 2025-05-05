import type { GraphqlChangeset } from '#lib/graphql-changeset/index.js'

export * from './read.js'

export interface Schema {
  versions: [GraphqlChangeset.ChangeSet, ...GraphqlChangeset.ChangeSet[]]
}
