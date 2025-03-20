import type { GraphQLNamedType, GraphQLSchema } from 'graphql'
import { buildSchema } from 'graphql'

const fetchSchema = async (url: string | URL): Promise<string> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load schema: ${response.statusText}`)
  }
  return response.text()
}

export const loadSchema = async (url: string | URL): Promise<GraphQLSchema> => {
  const schemaContent = await fetchSchema(url)
  return buildSchema(schemaContent)
}

export const getTypes = (schema: GraphQLSchema): GraphQLNamedType[] => {
  return Object.values(schema.getTypeMap())
    .filter(type => !type.name.startsWith(`__`)) // Filter out internal GraphQL types
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
}
