import { type GraphQLObjectType, type GraphQLSchema, isObjectType } from 'graphql'
import * as TypesLike from './types-like.js'

/**
 * Get a type from the schema by name, throwing if not found.
 */
export const getTypeOrThrow = (schema: GraphQLSchema, typeName: string): TypesLike.Named => {
  const type = schema.getType(typeName)
  if (!type) {
    throw new Error(`Type "${typeName}" not found in schema`)
  }
  return type
}

/**
 * Get a fielded type (Object, Interface) from the schema by name, throwing if not found or wrong kind.
 */
export const getFieldedTypeOrThrow = (schema: GraphQLSchema, typeName: string): TypesLike.Fielded => {
  const type = getTypeOrThrow(schema, typeName)
  if (!TypesLike.isFielded(type)) {
    throw new Error(`Type "${typeName}" is not a fielded type (Object or Interface)`)
  }
  return type
}

/**
 * Get an object type from the schema by name, throwing if not found or wrong kind.
 */
export const getObjectTypeOrThrow = (schema: GraphQLSchema, typeName: string): GraphQLObjectType => {
  const type = getTypeOrThrow(schema, typeName)
  if (!isObjectType(type)) {
    throw new Error(`Type "${typeName}" is not an object type`)
  }
  return type
}
