import { GraphqlChange } from '#lib/graphql-change'
import { GraphqlChangeset } from '#lib/graphql-changeset'
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
  changelog: GraphqlChangeset.ChangelogLinked,
): SchemaLifecycle => {
  const data: SchemaLifecycle['data'] = {}

  // Process changesets in chronological order (oldest to newest)
  for (const changeSet of changelog) {
    if (GraphqlChangeset.isInitialChangeSetLinked(changeSet)) {
      Handlers.createInitialTypeLifecycles(data, changeSet)
      continue
    }

    for (const change of changeSet.changes) {
      if (
        GraphqlChange.Group.isTypeOperation(change)
        || GraphqlChange.Group.isFieldOperation(change)
        || GraphqlChange.Group.isInputFieldOperation(change)
      ) {
        const changeGroupType = GraphqlChange.Group.getType(change)
        const handler = Handlers[changeGroupType]
        handler(data, change as any, changeSet)
      }
    }
  }

  return { data }
}
