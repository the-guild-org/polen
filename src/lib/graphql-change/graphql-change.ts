import { GraphqlInspector } from '#dep/graphql-inspector/index'
import type { GrafaidOld } from '#lib/grafaid-old/index'
import type { Change } from './change-types.js'

export * from './change-types.js'

export * from './criticality.js'

import * as Group from './change-groups.js'
export { Group }

export const calcChangeset = async (parameters: {
  after: GrafaidOld.Schema.Schema
  before: GrafaidOld.Schema.Schema
}): Promise<Change[]> => {
  const changes = await GraphqlInspector.Core.diff(parameters.before, parameters.after)
  return changes
}
