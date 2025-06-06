import type { GrafaidOld } from '#lib/grafaid-old'
import type { GraphqlChange } from '#lib/graphql-change'

export interface ChangeSet {
  after: GrafaidOld.Schema.Schema
  before: GrafaidOld.Schema.Schema
  changes: GraphqlChange.Change[]
  date: Date
}
