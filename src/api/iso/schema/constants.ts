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
 * @deprecated revisions have native id concept now
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

  // Throw error for invalid dates instead of silently defaulting
  throw new Error(`Invalid version string: ${version}`)
}

/**
 * Determine if a version at the given index should have a changelog file.
 * Only non-oldest versions get changelog files.
 */
export const shouldVersionHaveChangelog = (versionIndex: number, totalVersions: number): boolean => {
  return versionIndex < totalVersions - 1
}
