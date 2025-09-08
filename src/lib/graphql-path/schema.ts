/**
 * GraphQL schema location utilities for definition paths
 */

import { Grafaid } from '#lib/grafaid'
import { Data, Either, Match } from 'effect'
import * as Definition from './definition.js'

// ============================================================================
// Errors
// ============================================================================

export class TypeNotFoundError extends Data.TaggedError('TypeNotFoundError')<{
  typeName: string
  path: string
}> {}

export class FieldNotFoundError extends Data.TaggedError('FieldNotFoundError')<{
  typeName: string
  fieldName: string
  path: string
}> {}

// ============================================================================
// Locate Functions
// ============================================================================

/**
 * Locate a type in the GraphQL schema from a type definition path.
 *
 * @param schema - The GraphQL schema
 * @param path - The type definition path
 * @returns Either the located type or a TypeNotFoundError
 */
export const locateType = (
  schema: Grafaid.Schema.Schema,
  path: Definition.TypeDefinitionPath,
): Either.Either<Grafaid.Schema.TypesLike.Named, TypeNotFoundError> => {
  const typeName = Definition.getType(path)
  const type = schema.getType(typeName)
  if (!type) {
    return Either.left(
      new TypeNotFoundError({
        typeName,
        path: Definition.encodeSync(path),
      }),
    )
  }
  return Either.right(type)
}

/**
 * Locate a field in the GraphQL schema from a field definition path.
 *
 * @param schema - The GraphQL schema
 * @param path - The field definition path
 * @returns Either the located field or a FieldNotFoundError
 */
export const locateField = (
  schema: Grafaid.Schema.Schema,
  path: Definition.FieldDefinitionPath,
): Either.Either<Grafaid.Schema.NodesLike.Field, FieldNotFoundError> => {
  const typeName = Definition.getType(path)
  const fieldName = Definition.getField(path)

  const type = schema.getType(typeName)
  if (!type) {
    return Either.left(
      new FieldNotFoundError({
        typeName,
        fieldName,
        path: Definition.encodeSync(path),
      }),
    )
  }

  if (!Grafaid.Schema.TypesLike.isFielded(type)) {
    return Either.left(
      new FieldNotFoundError({
        typeName,
        fieldName,
        path: Definition.encodeSync(path),
      }),
    )
  }

  const fields = type.getFields()
  const field = fields[fieldName]

  if (!field) {
    // dprint-ignore
    return Either.left(new FieldNotFoundError({
      typeName,
      fieldName,
      path: Definition.encodeSync(path),
    }))
  }

  return Either.right(field)
}

/**
 * Locate a type or field in the GraphQL schema from a definition path.
 *
 * @param schema - The GraphQL schema
 * @param path - The definition path (type or field)
 * @returns Either the located type/field or an error
 */
export const locate = (
  schema: Grafaid.Schema.Schema,
  path: Definition.DefinitionPath,
): Either.Either<
  Grafaid.Schema.TypesLike.Named | Grafaid.Schema.NodesLike.Field,
  TypeNotFoundError | FieldNotFoundError
> => {
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
      // This should never happen with proper path types
      // Return a generic error for unsupported path types
      return Either.left(
        new TypeNotFoundError({
          typeName: 'unknown',
          path: Definition.encodeSync(path),
        }),
      )
    }),
  )
}
