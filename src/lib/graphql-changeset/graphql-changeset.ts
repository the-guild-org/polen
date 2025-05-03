import type { GrafaidOld } from '#lib/grafaid-old/index.js'
import type { GraphqlChange } from '#lib/graphql-change/index.js'

export interface ChangeSet {
  date: Date
  before: GrafaidOld.Schema.Schema
  after: GrafaidOld.Schema.Schema
  changes: GraphqlChange.Change[]
  description?: string
}
