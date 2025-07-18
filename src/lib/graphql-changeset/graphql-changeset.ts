import type { GrafaidOld } from '#lib/grafaid-old'
import type { GraphqlChange } from '#lib/graphql-change'

/**
 * Core changeset data that can be serialized
 */
export interface ChangeSetData {
  changes: GraphqlChange.Change[]
  date: Date
}

/**
 * Runtime changeset with nullable schema references
 */
export interface ChangeSetRuntime extends ChangeSetData {
  after: GrafaidOld.Schema.Schema | null
  before: GrafaidOld.Schema.Schema | null
}
