import type { GraphQLSchema } from 'graphql'
import type { RouterState } from 'react-router'

declare global {
  interface Window {
    __polenCacheSchema?: GraphQLSchema | undefined
    __staticRouterHydrationData?:
      | Partial<
        Pick<RouterState, `loaderData` | `actionData` | `errors`>
      >
      | undefined
  }
}

export {}
