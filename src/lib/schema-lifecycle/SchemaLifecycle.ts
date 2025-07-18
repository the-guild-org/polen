import type { GraphQLSchema } from 'graphql'
import { GraphqlChange } from '#lib/graphql-change'
import type { GraphqlChangeset } from '#lib/graphql-changeset'
import * as Handlers from './handlers.js'
import type { NamedTypeLifecycle } from './NamedTypeLifecycle.js'

/**
 * Schema lifecycle data structure containing all types and their evolution
 */
export interface SchemaLifecycle {
  data: Record<string, NamedTypeLifecycle>
}

export type SupportedChange =
  | GraphqlChange.Group.TypeOperation
  | GraphqlChange.Group.FieldOperation
  | GraphqlChange.Group.InputFieldOperation

/**
 * Build schema lifecycle data from changesets
 */
export const create = (
  changesets: GraphqlChangeset.ChangeSetData[], 
  versions: string[],
  schemas: GraphQLSchema[],
): SchemaLifecycle => {
  const data: Record<string, NamedTypeLifecycle> = {}

  // Process changesets in chronological order (oldest to newest)
  for (let index = 0; index < changesets.length; index++) {
    const changeset = changesets[index]!
    const schemaVersion = versions[index] ?? null
    const schema = schemas[index]

    if (!schema) {
      throw new Error(`Schema not provided for changeset ${index}`)
    }

    // Create context once per changeset
    const context: Handlers.HandlerContext = {
      schema,
      date: changeset.date,
      changeSet: {
        changes: changeset.changes,
        date: changeset.date,
      },
      schemaVersion,
    }

    for (const change of changeset.changes) {
      if (
        GraphqlChange.Group.isTypeOperation(change)
        || GraphqlChange.Group.isFieldOperation(change)
        || GraphqlChange.Group.isInputFieldOperation(change)
      ) {
        const changeGroupType = GraphqlChange.Group.getType(change)
        const handler = Handlers[changeGroupType]
        handler(data, change as any, context)
      }
    }
  }

  return { data }
}
