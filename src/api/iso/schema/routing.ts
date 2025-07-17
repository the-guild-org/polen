import { Grafaid } from '#lib/grafaid/index'
import { VERSION_LATEST } from './constants.js'

export interface ReferencePathParts {
  version?: string
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
export const createReferenceBasePath = (version?: string): string => {
  return joinSegmentsAndPaths(segmentLiterals.reference, createReferenceVersionPath(version))
}

export const segmentLiterals = {
  reference: 'reference',
  version: 'version',
}

/**
 * Create a base path for reference pages based on the current version
 * Used for sidebar navigation and other UI components that need version-aware paths
 */
export const createReferenceVersionPath = (version?: string): string => {
  if (version === undefined) return ''
  return version === VERSION_LATEST
    ? ``
    : `/${segmentLiterals.version}/${version}`
}

export const joinSegmentsAndPaths = (
  ...segmentsOrPaths: (string | undefined | null | (string | null | undefined)[])[]
): string => {
  const path = '/' + segmentsOrPaths
    .flat()
    .filter((_): _ is string => _ !== undefined && _ !== null)
    .map(chunkUnformatted =>
      chunkUnformatted
        .replace(/^\//, '')
        .replace(/\/$/, '')
    )
    .filter(Boolean)
    .join('/')

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
  schema: import('graphql').GraphQLSchema
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
  const type = schema.getType(typeName)
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
