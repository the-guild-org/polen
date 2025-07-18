import type { GraphqlChangeset } from '#lib/graphql-changeset'
import type { SchemaLink } from './SchemaLink.js'

/**
 * Base lifecycle event
 */
export interface LifecycleEventBase {
  date: Date
  changeSet: GraphqlChangeset.ChangeSetData | null
  schema: SchemaLink
}

/**
 * Event when a type or field is added
 */
export interface AddedEvent extends LifecycleEventBase {
  type: 'added'
}

/**
 * Event when a type or field is removed
 */
export interface RemovedEvent extends LifecycleEventBase {
  type: 'removed'
}
