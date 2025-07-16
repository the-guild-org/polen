import type { GraphqlChangeset } from '#lib/graphql-changeset/index'

// Re-export everything from isomorphic layer
export * from '../iso/schema/constants.js'
export * as Routing from '../iso/schema/routing.js'

// Server-only exports
export * as DataSources from './data-sources/data-sources.js'
export * from './metadata.js'
export * from './read.js'

export type ChangeSets = GraphqlChangeset.ChangeSet[]

export type NonEmptyChangeSets = [GraphqlChangeset.ChangeSet, ...GraphqlChangeset.ChangeSet[]]

/**
 * Changelog data structure for JSON serialization
 */
export interface ChangelogData {
  changes: GraphqlChangeset.ChangeSet['changes']
  date: string
}
