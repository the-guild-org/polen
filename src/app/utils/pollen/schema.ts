import { GraphQLSchema, buildSchema } from 'graphql'

/**
 * Virtual import of the GraphQL schema provided by Pollen
 * 
 * This will be replaced at build time with the actual schema content
 * when running through the Pollen CLI
 */
// @ts-expect-error - Virtual module
import schemaContent from 'virtual:pollen-schema'

/**
 * Get the GraphQL schema that was provided to the Pollen CLI
 * 
 * @returns The GraphQL schema instance
 */
export function getSchema(): GraphQLSchema {
  if (!schemaContent) {
    throw new Error(
      'GraphQL schema not found. Make sure you are running your app via the Pollen CLI with a valid schema file.'
    )
  }
  return buildSchema(schemaContent)
}

/**
 * Check if the app is running with Pollen
 * 
 * @returns True if the app is running with Pollen, false otherwise
 */
export function isPollenEnabled(): boolean {
  return !!schemaContent
}
