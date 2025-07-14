import type { GraphQLSchema } from 'graphql'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import PROJECT_SCHEMA_METADATA from 'virtual:polen/project/schema-metadata'
import { dateToVersionString, VERSION_LATEST } from '../lib/schema-utils/constants.js'
import { astToSchema, createSchemaCache } from '../lib/schema-utils/schema-utils.js'

// Cache for loaded schemas
const schemaCache = createSchemaCache()

/**
 * Check if schema data is available
 */
export const hasSchema = (): boolean => {
  // In dev mode, check virtual module
  if (PROJECT_DATA.schema) {
    return true
  }
  // In prod mode, check metadata
  return PROJECT_SCHEMA_METADATA.hasSchema
}

/**
 * Get available schema versions
 */
export const getAvailableVersions = (): string[] => {
  // In dev mode, derive from virtual module
  if (PROJECT_DATA.schema) {
    return PROJECT_DATA.schema.versions.map((version, index) =>
      index === 0 ? VERSION_LATEST : dateToVersionString(version.date)
    )
  }
  // In prod mode, use metadata
  return PROJECT_SCHEMA_METADATA.versions
}

/**
 * Get schema for a specific version
 */
export const getSchema = async (version: string): Promise<GraphQLSchema | null> => {
  // In dev mode, use virtual module data
  if (PROJECT_DATA.schema) {
    const schemaVersion = version === VERSION_LATEST
      ? PROJECT_DATA.schema.versions[0]
      : PROJECT_DATA.schema.versions.find(v => dateToVersionString(v.date) === version)

    return schemaVersion?.after || null
  }

  // In prod mode, check if we have schema metadata
  if (!PROJECT_SCHEMA_METADATA.hasSchema) {
    return null
  }

  // Check cache first
  if (schemaCache.has(version)) {
    return schemaCache.get(version) || null
  }

  // Fetch schema from assets
  try {
    const assetPath = `${PROJECT_DATA.basePath}${PROJECT_DATA.paths.relative.build.relative.assets}`
    const response = await fetch(`${assetPath}/schemas/${version}.json`)

    if (!response.ok) {
      throw new Error(`Failed to fetch schema for version ${version}`)
    }

    const schemaAst = await response.json()
    const schema = astToSchema(schemaAst)

    // Cache the converted schema
    schemaCache.set(version, schema)

    return schema
  } catch (error) {
    console.error(`Failed to load schema:`, error)
    return null
  }
}
