import type { GraphqlChangeset } from '#lib/graphql-changeset'
import type { VersionableSchema } from '#lib/graphql-changeset/graphql-changeset'

/**
 * Base lifecycle event
 */
export interface LifecycleEventBase {
  date: Date
  /**
   * null if unlinked. Soemthing external should use `date` to link changeSet.
   */
  changeSet: GraphqlChangeset.ChangeSet | null
  schema: VersionableSchema
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
