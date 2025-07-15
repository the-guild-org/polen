import type { GraphQLSchema } from 'graphql'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import PROJECT_SCHEMA_METADATA from 'virtual:polen/project/schema-metadata'
import { polenUrlPathAssets } from '../lib/polen-url.js'
import { astToSchema, createSchemaCache } from '../lib/schema-utils/schema-utils.js'

// Cache for loaded schemas
const schemaCache = createSchemaCache()

// HMR cache invalidation for development
if (import.meta.hot) {
  import.meta.hot.on('polen:schema-invalidate', () => {
    console.log('[HMR] Schema cache invalidated')
    schemaCache.clear()

    // Brute force approach: reload the page to ensure fresh data
    // This guarantees all components see the updated schema immediately
    // TODO: When we have reactive data fetching, remove this reload
    //       and let the reactive system handle updates gracefully
    window.location.reload()
  })
}

/**
 * Check if schema data is available
 */
export const hasSchema = (): boolean => {
  return PROJECT_SCHEMA_METADATA.hasSchema
}

/**
 * Get available schema versions
 */
export const getAvailableVersions = (): string[] => {
  return PROJECT_SCHEMA_METADATA.versions
}

/**
 * Get schema for a specific version
 */
export const get = async (version: string): Promise<GraphQLSchema | null> => {
  // Check if we have schema metadata
  if (!PROJECT_SCHEMA_METADATA.hasSchema) {
    return null
  }

  // Check cache first
  if (schemaCache.has(version)) {
    return schemaCache.get(version) || null
  }

  // Fetch schema from assets
  try {
    // Construct URL - works for both dev and prod due to dev asset middleware
    const schemaUrl = polenUrlPathAssets(
      PROJECT_DATA.paths.relative.build.relative.assets.relative.schemas,
      `${version}.json`,
    )

    const response = await fetch(schemaUrl)

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
