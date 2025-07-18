import type { GraphqlChangeset } from '#lib/graphql-changeset'

// Re-export everything from isomorphic layer
export * from '../iso/schema/constants.js'
export * as Routing from '../iso/schema/routing.js'

// Server-only exports
export * as DataSources from './data-sources/data-sources.js'
export * from './metadata.js'
export * from './read.js'

export type ChangeSets = GraphqlChangeset.ChangeSetRuntime[]

export type NonEmptyChangeSets = [GraphqlChangeset.ChangeSetRuntime, ...GraphqlChangeset.ChangeSetRuntime[]]

/**
 * Changelog data structure for JSON serialization
 */
export interface ChangelogData {
  changes: GraphqlChangeset.ChangeSetData['changes']
  date: string
}
