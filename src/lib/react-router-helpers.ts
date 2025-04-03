import type { ReactRouter } from './react-router/_namespace.js'

export const createRoute = <routeObject extends ReactRouter.RouteObject>(
  routeObject: routeObject,
): routeObject => {
  return {
    id: routeObject.path,
    ...routeObject,
  }
}

export type IndexRouteObjectInput = Omit<ReactRouter.IndexRouteObject, `index` | `children`>

export const createRouteIndex = (
  indexRouteObjectInput: IndexRouteObjectInput,
): ReactRouter.IndexRouteObject => {
  return {
    ...indexRouteObjectInput,
    index: true,
    children: undefined,
  }
}
