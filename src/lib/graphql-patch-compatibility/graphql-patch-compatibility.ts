import type { GraphqlPatch } from '../graphql-patch/graphql-patch.js'

export namespace GraphqlPatchCompatibility {
  export interface GraphqlPatchCompatibility {
    settings: Settings
    breaking: GraphqlPatch.Change[]
  }
  // eslint-disable-next-line
  export interface Settings {
    // todo: Various controls over the compatibility check
  }
}
