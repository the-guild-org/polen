/**
 * Constants for schema versioning
 */

/**
 * The version identifier for the latest schema
 */
export const VERSION_LATEST = `latest`

/**
 * Separator used in ISO date strings
 */
export const VERSION_DATE_SEPARATOR = `T`

/**
 * Fallback version name when date parsing fails
 */
export const VERSION_UNKNOWN_FALLBACK = `unknown`

/**
 * Convert a date to a version string in YYYY-MM-DD format
 */
export const dateToVersionString = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}