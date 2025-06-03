import type { ReactRouter } from '#dep/react-router/index.js'
import type { Http } from '@wollybeard/kit'

export * from './get-paths-patterns.js'

export type RouteObject = RouteObjectIndex | RouteObjectNonIndex

export interface RouteObjectIndex extends ReactRouter.IndexRouteObject {
  handle?: RouteHandle
}

export interface RouteObjectNonIndex extends ReactRouter.NonIndexRouteObject {
  handle?: RouteHandle
}

// todo: make globally augmentable
export interface RouteHandle {
  statusCode?: Http.Status.Code.All
}

export const createRoute = <routeObject extends RouteObject>(
  routeObject: routeObject,
): routeObject => {
  return {
    id: routeObject.path,
    ...routeObject,
  }
}

export type RouteObjectIndexInput = Omit<RouteObjectIndex, `index` | `children`>

export const createRouteIndex = (
  indexRouteObjectInput: RouteObjectIndexInput,
): RouteObjectIndex => {
  return {
    ...indexRouteObjectInput,
    index: true,
    children: undefined,
  }
}
