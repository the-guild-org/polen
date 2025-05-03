import { GraphqlInspector } from '#dep/graphql-inspector/index.js'
import type { GrafaidOld } from '#lib/grafaid-old/index.js'

export type Change = GraphqlInspector.Core.SerializableChange & {
  message: string,
  path?: string,
  criticality: GraphqlInspector.Core.Criticality,
}

export const calcChangeset = async (parameters: {
  after: GrafaidOld.Schema.Schema,
  before: GrafaidOld.Schema.Schema,
}): Promise<Change[]> => {
  const changes = await GraphqlInspector.Core.diff(parameters.before, parameters.after)
  return changes
}
