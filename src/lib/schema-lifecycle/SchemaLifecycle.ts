import { Grafaid } from '#lib/grafaid/$'
import { GraphqlChange } from '#lib/graphql-change'
import { GraphqlChangeset } from '#lib/graphql-changeset'
import type { GraphQLSchema } from 'graphql'
import { SuperJSON } from 'superjson'
import * as Handlers from './handlers.js'
import type { NamedTypeLifecycle } from './NamedTypeLifecycle.js'

const superjson = new SuperJSON()

// Register codec to handle GraphQL schemas - convert to null to avoid circular refs
superjson.registerCustom({
  isApplicable: (v): v is GraphQLSchema => v?.constructor?.name === 'GraphQLSchema',
  serialize: () => null,
  deserialize: () => null,
}, 'GraphQLSchema')

// Register codec to handle ChangeSet objects - convert to null as per type design
superjson.registerCustom({
  isApplicable: GraphqlChangeset.isChangeSet,
  serialize: () => ({ value: null }),
  deserialize: () => null,
}, 'ChangeSet')

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

/**
 * Convert SchemaLifecycle to JSON string
 */
export const toJson = (lifecycle: SchemaLifecycle, options?: { pretty?: boolean }): string => {
  const isPretty = options?.pretty ?? true
  if (isPretty) {
    const serialized = superjson.serialize(lifecycle)
    return JSON.stringify(serialized, null, 2)
  }
  return superjson.stringify(lifecycle)
}

/**
 * Parse SchemaLifecycle from JSON string
 */
export const fromJson = (json: string): SchemaLifecycle => {
  return superjson.parse(json)
}
