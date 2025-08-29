// Global window properties
import type { GraphQLSchema } from 'graphql'
import type { RouterState } from 'react-router'
import type { PolenGlobalData } from '../template/constants'

declare global {
  var __POLEN__: PolenGlobalData

  interface Window {
    __polenCacheSchema?: GraphQLSchema | undefined
    __staticRouterHydrationData?:
      | Partial<
        Pick<RouterState, `loaderData` | `actionData` | `errors`>
      >
      | undefined
  }
}
