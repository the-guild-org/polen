import type { GrafaidOld } from '#lib/grafaid-old/index.js'
import type { GraphqlChange } from '#lib/graphql-change/index.js'

export interface ChangeSet {
  after: GrafaidOld.Schema.Schema
  before: GrafaidOld.Schema.Schema
  changes: GraphqlChange.Change[]
  date: Date
}
