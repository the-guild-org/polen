/**
 * GraphQL schema location utilities for definition paths
 */

import { Grafaid } from '#lib/grafaid'
import { Match } from 'effect'
import * as Definition from './definition.js'

// ============================================================================
// Locate Functions
// ============================================================================

/**
 * Locate a type in the GraphQL schema from a type definition path.
 *
 * @param schema - The GraphQL schema
 * @param path - The type definition path
 * @returns The located type
 * @throws Error if type not found
 */
export const locateType = (
  schema: Grafaid.Schema.Schema,
  path: Definition.TypeDefinitionPath,
): Grafaid.Schema.TypesLike.Named => {
  const typeName = Definition.getType(path)
  const type = schema.getType(typeName)
  if (!type) {
    throw new Error(`Could not find type ${typeName}`)
  }
  return type
}

/**
 * Locate a field in the GraphQL schema from a field definition path.
 *
 * @param schema - The GraphQL schema
 * @param path - The field definition path
 * @returns The located field
 * @throws Error if type or field not found
 */
export const locateField = (
  schema: Grafaid.Schema.Schema,
  path: Definition.FieldDefinitionPath,
): Grafaid.Schema.NodesLike.Field => {
  const typeName = Definition.getType(path)
  const fieldName = Definition.getField(path)

  const type = schema.getType(typeName)
  if (!type) {
    throw new Error(`Could not find type ${typeName}`)
  }

  if (!Grafaid.Schema.TypesLike.isFielded(type)) {
    throw new Error(`Type ${typeName} does not have fields`)
  }

  const fields = type.getFields()
  const field = fields[fieldName]

  if (!field) {
    // dprint-ignore
    throw new Error(`Could not find field ${fieldName} on type ${typeName}`)
  }

  return field
}

/**
 * Locate a type or field in the GraphQL schema from a definition path.
 *
 * @param schema - The GraphQL schema
 * @param path - The definition path (type or field)
 * @returns The located type or field
 */
export const locate = (
  schema: Grafaid.Schema.Schema,
  path: Definition.DefinitionPath,
): Grafaid.Schema.TypesLike.Named | Grafaid.Schema.NodesLike.Field => {
  return Match.value(path).pipe(
    Match.when(
      Definition.isTypeDefinitionPath,
      (p) => locateType(schema, p),
    ),
    Match.when(
      Definition.isFieldDefinitionPath,
      (p) => locateField(schema, p),
    ),
    Match.orElse(() => {
      throw new Error(`Unsupported path type for schema location`)
    }),
  )
}
