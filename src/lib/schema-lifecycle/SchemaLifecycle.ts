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
export const create = (changesets: GraphqlChangeset.ChangeSetData[], versions: string[]): SchemaLifecycle => {
  const data: Record<string, NamedTypeLifecycle> = {}

  // Process changesets in chronological order (oldest to newest)
  for (let index = 0; index < changesets.length; index++) {
    const changeset = changesets[index]!

    // Get version from versions array or null if not provided
    const schemaVersion = versions[index] ?? null

    // Create changeset data without schemas for lifecycle events
    const changeSetData: GraphqlChangeset.ChangeSetData = {
      changes: changeset.changes,
      date: changeset.date,
    }

    for (const change of changeset.changes) {
      if (
        GraphqlChange.Group.isTypeOperation(change)
        || GraphqlChange.Group.isFieldOperation(change)
        || GraphqlChange.Group.isInputFieldOperation(change)
      ) {
        const changeGroupType = GraphqlChange.Group.getType(change)
        const handler = Handlers[changeGroupType]
        handler(data, change as any, changeset.date, changeSetData, schemaVersion)
      }
    }
  }

  return { data }
}
