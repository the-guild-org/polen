import { A } from '#dep/effect'
import type { GraphQLSchema } from 'graphql'

// ============================================================================
// Types
// ============================================================================

export interface CategoryConfig {
  name: string
  typeNames: Array<string | RegExp>
  mode?: 'include' | 'exclude'
}

export interface ProcessedCategory {
  name: string
  types: string[]
}

// ============================================================================
// Processor
// ============================================================================

/**
 * Process categories configuration and return matched type names.
 *
 * @param schema - The GraphQL schema to process
 * @param categoriesConfig - The categories configuration from the Polen config
 * @returns Array of processed categories with type names
 */
export const processCategories = (
  schema: GraphQLSchema,
  categoriesConfig?: CategoryConfig[],
): ProcessedCategory[] => {
  // If no categories config, return empty array
  if (!categoriesConfig || categoriesConfig.length === 0) {
    return []
  }

  const result: ProcessedCategory[] = []

  // Get all types from the schema
  const typeMap = schema.getTypeMap()
  const allTypes = Object.values(typeMap).filter(type => {
    // Filter out introspection types and built-in scalars
    return !type.name.startsWith('__')
      && !['String', 'Int', 'Float', 'Boolean', 'ID'].includes(type.name)
  })

  // Process each category
  for (const categoryConfig of categoriesConfig) {
    const mode = categoryConfig.mode || 'include'
    const matchedTypeNames: string[] = []

    for (const type of allTypes) {
      const isMatch = categoryConfig.typeNames.some(pattern => {
        if (typeof pattern === 'string') {
          // Exact string match
          return type.name === pattern
        } else if (pattern instanceof RegExp) {
          // RegExp match
          return pattern.test(type.name)
        }
        return false
      })

      // Add to matched types based on mode
      if ((mode === 'include' && isMatch) || (mode === 'exclude' && !isMatch)) {
        matchedTypeNames.push(type.name)
      }
    }

    // Add processed category if it has matched types
    if (matchedTypeNames.length > 0) {
      result.push({
        name: categoryConfig.name,
        types: matchedTypeNames,
      })
    }
  }

  return result
}

/**
 * Process versioned categories configuration.
 * Selects the appropriate categories based on the schema version.
 *
 * @param schema - The GraphQL schema to process
 * @param categoriesConfig - The categories configuration (can be versioned)
 * @param version - The schema version (optional, for versioned schemas)
 * @returns Array of processed categories with type names
 */
export const processCategoriesWithVersion = (
  schema: GraphQLSchema,
  categoriesConfig?: CategoryConfig[] | Record<string, CategoryConfig[]>,
  version?: string,
): ProcessedCategory[] => {
  if (!categoriesConfig) {
    return []
  }

  // Check if it's versioned configuration
  if (A.isArray(categoriesConfig)) {
    // Plain array - apply to all versions
    return processCategories(schema, categoriesConfig)
  } else {
    // Versioned object - find matching version
    if (version && categoriesConfig[version]) {
      return processCategories(schema, categoriesConfig[version])
    }

    // No matching version found, return empty array
    return []
  }
}
