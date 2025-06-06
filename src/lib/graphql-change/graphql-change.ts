import { GraphqlInspector } from '#dep/graphql-inspector'
import type { GrafaidOld } from '#lib/grafaid-old'

export type Change = GraphqlInspector.Core.SerializableChange & {
  message: string
  path?: string
  criticality: GraphqlInspector.Core.Criticality
}

export const calcChangeset = async (parameters: {
  after: GrafaidOld.Schema.Schema
  before: GrafaidOld.Schema.Schema
}): Promise<Change[]> => {
  const changes = await GraphqlInspector.Core.diff(parameters.before, parameters.after)
  return changes
}
