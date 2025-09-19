import { A, O } from '#dep/effect'
import { Predicate } from 'effect'
import { Grafaid, Schema, Version } from 'graphql-kit'

export interface ReferencePathParts {
  version?: Version.Version
  type?: string
  field?: string
}

interface RouteCheck {
  pathname: string
  params: Record<string, string | undefined>
}

export const createReferencePath = (parts: ReferencePathParts): string => {
  const basePath = createReferenceBasePath(parts.version)
  return joinSegmentsAndPaths(basePath, parts.type, parts.field)
}

/**
 * Create a base path for reference pages based on the current version
 * Used for sidebar navigation and other UI components that need version-aware paths
 */
export const createReferenceBasePath = (version?: Version.Version): string => {
  return joinSegmentsAndPaths(segmentLiterals.reference, createReferenceVersionPath(version))
}

export const segmentLiterals = {
  reference: 'reference',
  version: 'version',
  changelog: 'changelog',
}

/**
 * Create a base path for reference pages based on the current version
 * Used for sidebar navigation and other UI components that need version-aware paths
 */
export const createReferenceVersionPath = (version?: Version.Version): string => {
  if (version === undefined) return ''
  // VERSION_LATEST is not used with the Version type anymore
  // Just use the version string directly
  return `/${segmentLiterals.version}/${Version.encodeSync(version)}`
}

export const joinSegmentsAndPaths = (
  ...segmentsOrPaths: (string | undefined | null | (string | null | undefined)[])[]
): string => {
  const segments = A.filterMap(
    segmentsOrPaths.flat(),
    (segment) => {
      if (!Predicate.isNotNullable(segment)) return O.none()
      const cleaned = segment.replace(/^\//, '').replace(/\/$/, '')
      return cleaned ? O.some(cleaned) : O.none()
    },
  )
  const path = '/' + segments.join('/')

  return path
}

/**
 * Check if the current route is a reference route
 * @param route - Route information containing pathname and params
 * @returns True if on a reference route
 */
export const isReferenceRoute = (route: RouteCheck): boolean => {
  return route.params[`type`] !== undefined
    || route.params[`field`] !== undefined
    || route.params[`argument`] !== undefined
    || route.pathname.includes(`/${segmentLiterals.reference}`)
}

/**
 * Assert that the current route is a reference route
 * @param route - Route information containing pathname and params
 * @throws {Error} If not on a reference route
 */
export const assertReferenceRoute = (route: RouteCheck): void => {
  if (!isReferenceRoute(route)) {
    throw new Error('Not on a reference route. This function can only be used on reference routes.')
  }
}

/**
 * View type for reference routes
 */
export type ReferenceViewType =
  | 'index' // No type selected
  | 'type' // Type selected, no field
  | 'field' // Type and field selected
  | 'type-missing' // Type not found in schema
  | 'field-missing' // Field not found on type

export interface ReferenceViewParams {
  schema: Schema.Schema
  type?: string
  field?: string
}

/**
 * Determine the view type for a reference route based on params and schema
 */
export const getReferenceViewType = (params: ReferenceViewParams): ReferenceViewType => {
  const { schema, type: typeName, field: fieldName } = params

  // No type selected - show index
  if (!typeName) {
    return 'index'
  }

  // Check if type exists
  const type = schema.definition.getType(typeName)
  if (!type) {
    return 'type-missing'
  }

  // No field selected - show type
  if (!fieldName) {
    return 'type'
  }

  // Check if type has fields
  if (!Grafaid.Schema.TypesLike.isFielded(type)) {
    return 'field-missing'
  }

  // Check if field exists
  const fields = type.getFields()
  if (!fields[fieldName]) {
    return 'field-missing'
  }

  // Field exists - show field
  return 'field'
}

/**
 * Type guard to check if view type indicates missing content
 */
export const isMissingView = (viewType: ReferenceViewType): viewType is 'type-missing' | 'field-missing' => {
  return viewType === 'type-missing' || viewType === 'field-missing'
}

/**
 * Create a URL to the changelog for a specific revision date
 * @param revisionDate - The date string from the revision (format: YYYY-MM-DD)
 * @param currentVersion - The current version being viewed (optional)
 * @returns URL path to the changelog with anchor to the specific date
 */
export const createChangelogUrl = (revisionDate: string, schema: Schema.Schema): string => {
  // Create base changelog path with version if needed
  const version = Schema.getVersion(schema)
  const changelogBase = version
    ? joinSegmentsAndPaths(segmentLiterals.changelog, segmentLiterals.version, Version.encodeSync(version))
    : `/${segmentLiterals.changelog}`

  // Add anchor for the specific date
  return `${changelogBase}#${revisionDate}`
}
