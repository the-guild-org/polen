import { GraphQLNamedType, GraphQLSchema, buildSchema } from 'graphql'

async function fetchSchema(url: string | URL): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load schema: ${response.statusText}`)
  }
  return response.text()
}

export async function loadSchema(url: string | URL): Promise<GraphQLSchema> {
  const schemaContent = await fetchSchema(url)
  return buildSchema(schemaContent)
}

export function getTypes(schema: GraphQLSchema): GraphQLNamedType[] {
  return Object.values(schema.getTypeMap())
    .filter(type => !type.name.startsWith('__')) // Filter out internal GraphQL types
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
}
