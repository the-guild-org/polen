import type { GrafaidOld } from '#lib/grafaid-old/index.ts'
import type { GraphqlChange } from '#lib/graphql-change/index.ts'

export interface ChangeSet {
  after: GrafaidOld.Schema.Schema
  before: GrafaidOld.Schema.Schema
  changes: GraphqlChange.Change[]
  date: Date
}
