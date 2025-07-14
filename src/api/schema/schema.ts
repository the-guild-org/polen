import type { GraphqlChangeset } from '#lib/graphql-changeset/index'

export * as DataSources from './data-sources/data-sources.js'

export * from './read.js'

export interface Schema {
  versions: [GraphqlChangeset.ChangeSet, ...GraphqlChangeset.ChangeSet[]]
}

/**
 * Constants for schema versioning
 */

/**
 * The version identifier for the latest schema
 */
export const VERSION_LATEST = `latest`

/**
 * Fallback version name when date parsing fails
 */
export const VERSION_UNKNOWN_FALLBACK = `unknown`

/**
 * Convert a date to a version string in YYYY-MM-DD format
 */
export const dateToVersionString = (date: Date): string => {
  return date.toLocaleDateString('en-CA')
}
