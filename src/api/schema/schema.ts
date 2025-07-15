import type { GraphqlChangeset } from '#lib/graphql-changeset/index'

export * as DataSources from './data-sources/data-sources.js'

export * from './read.js'

export * from './metadata.js'

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

/**
 * Convert a version string back to a Date
 */
export const versionStringToDate = (version: string): Date => {
  if (version === VERSION_LATEST) {
    return new Date()
  }

  // Use modern date parsing - the version string should be in YYYY-MM-DD format
  // which is ISO 8601 compatible
  const parsedDate = new Date(version + 'T00:00:00Z')

  // Check if the date is valid
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate
  }

  // Fallback for invalid dates
  return new Date()
}
