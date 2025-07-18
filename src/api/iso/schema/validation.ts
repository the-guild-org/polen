import { Grafaid } from '#lib/grafaid'
import type { GraphQLFieldMap, GraphQLSchema } from 'graphql'

export interface PathValidation {
  version?: string
  type?: string
  field?: string
  argument?: string
}

/**
 * Check if a reference path exists in the given schema
 */
export const doesPathExist = (schema: GraphQLSchema, path: PathValidation): boolean => {
  if (!path.type) return true

  const type = schema.getType(path.type)
  if (!type) return false

  if (!path.field) return true

  if (!Grafaid.Schema.TypesLike.isFielded(type)) return false

  const fields = type.getFields() as GraphQLFieldMap<unknown, unknown>
  const field = fields[path.field]
  if (!field) return false

  if (!path.argument) return true

  // Check if argument exists
  const arg = field.args.find(a => a.name === path.argument)
  return !!arg
}

/**
 * Find the best fallback path when the current path doesn't exist
 */
export const findFallbackPath = (
  schema: GraphQLSchema,
  currentPath: PathValidation,
): PathValidation => {
  // If no type specified, return empty path
  if (!currentPath.type) {
    return { type: `Query` }
  }

  // Check if current path exists
  if (doesPathExist(schema, currentPath)) {
    return currentPath
  }

  // If viewing an argument that doesn't exist, fall back to parent field
  if (currentPath.argument && currentPath.field) {
    const fieldPath = { type: currentPath.type, field: currentPath.field }
    if (doesPathExist(schema, fieldPath)) {
      return fieldPath
    }
  }

  // If viewing a field that doesn't exist, fall back to parent type
  if (currentPath.field) {
    const typePath = { type: currentPath.type }
    if (doesPathExist(schema, typePath)) {
      return typePath
    }
  }

  // If viewing a type that doesn't exist, fall back to Query type
  return { type: `Query` }
}

/**
 * Get all available types in a schema
 */
export const getAvailableTypes = (schema: GraphQLSchema): string[] => {
  const typeMap = schema.getTypeMap()
  return Object.keys(typeMap).filter(name => !name.startsWith(`__`))
}

/**
 * Get all available fields for a type
 */
export const getAvailableFields = (schema: GraphQLSchema, typeName: string): string[] => {
  const type = schema.getType(typeName)
  if (!type || !Grafaid.Schema.TypesLike.isFielded(type)) {
    return []
  }

  const fields = type.getFields() as GraphQLFieldMap<unknown, unknown>
  return Object.keys(fields)
}

/**
 * Check if a path would require a redirect when switching to a new schema version
 */
export const wouldRequireRedirect = (
  currentSchema: GraphQLSchema,
  targetSchema: GraphQLSchema,
  currentPath: PathValidation,
): boolean => {
  const existsInCurrent = doesPathExist(currentSchema, currentPath)
  const existsInTarget = doesPathExist(targetSchema, currentPath)

  return existsInCurrent && !existsInTarget
}

/**
 * Get a human-readable description of what will happen when switching versions
 */
export const getRedirectDescription = (
  targetSchema: GraphQLSchema,
  currentPath: PathValidation,
  fallbackPath: PathValidation,
  targetVersion?: string,
): string | null => {
  if (!currentPath.type) return null

  const currentExists = doesPathExist(targetSchema, currentPath)
  if (currentExists) return null

  const versionInfo = targetVersion ? ` in version ${targetVersion}` : ` in this version`

  if (currentPath.argument && fallbackPath.field) {
    return `Argument "${currentPath.argument}" doesn't exist${versionInfo}. Redirecting to field "${fallbackPath.field}".`
  }

  if (currentPath.field && fallbackPath.type && !fallbackPath.field) {
    return `Field "${currentPath.field}" doesn't exist${versionInfo}. Redirecting to type "${fallbackPath.type}".`
  }

  if (currentPath.type !== fallbackPath.type) {
    return `Type "${currentPath.type}" doesn't exist${versionInfo}. Redirecting to type "${fallbackPath.type}".`
  }

  return `This path doesn't exist${versionInfo}. Redirecting to a valid location.`
}
