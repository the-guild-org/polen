import { GraphQLNamedType, GraphQLSchema, buildSchema } from 'graphql';

async function fetchSchema(): Promise<string> {
  const response = await fetch('/schema.graphql');
  if (!response.ok) {
    throw new Error(`Failed to load schema: ${response.statusText}`);
  }
  return response.text();
}

export async function loadSchema(): Promise<GraphQLSchema> {
  const schemaContent = await fetchSchema();
  return buildSchema(schemaContent);
}

export function getTypes(schema: GraphQLSchema): GraphQLNamedType[] {
  return Object.values(schema.getTypeMap())
    .filter(type => !type.name.startsWith('__')) // Filter out internal GraphQL types
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
}
