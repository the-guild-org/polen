import type { GraphqlPatchCompatibility } from '../graphql-patch-compatibility/graphql-patch-compatibility.js'
import type { GraphqlPatch } from '../graphql-patch/graphql-patch.js'

export interface GraphqlRelease {
  date: Date
  description?: string
  patch: GraphqlPatch.GraphqlPatch
  compatibility: GraphqlPatchCompatibility.GraphqlPatchCompatibility
}
