import { buildSchema, print } from 'graphql'
import type { DocumentNode, GraphQLSchema } from 'graphql'

/**
 * Convert a GraphQL AST back to a GraphQL Schema object
 */
export const astToSchema = (ast: DocumentNode): GraphQLSchema => {
  // Convert AST back to SDL string
  const sdl = print(ast)
  // Build schema from SDL
  return buildSchema(sdl)
}

/**
 * Simple cache for loaded schemas to avoid repeated conversions
 */
export const createSchemaCache = () => {
  const cache = new Map<string, GraphQLSchema>()
  
  return {
    get(version: string): GraphQLSchema | undefined {
      return cache.get(version)
    },
    
    set(version: string, schema: GraphQLSchema): void {
      // Limit cache size to prevent memory issues
      if (cache.size > 10) {
        const firstKey = cache.keys().next().value
        if (firstKey) cache.delete(firstKey)
      }
      cache.set(version, schema)
    },
    
    has(version: string): boolean {
      return cache.has(version)
    },
    
    clear(): void {
      cache.clear()
    }
  }
}