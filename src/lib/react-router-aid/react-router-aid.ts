import type { ReactRouter } from '#dep/react-router/index.js'

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
  // todo
  statusCode?: 404 // (typeof Http.Status)[keyof typeof Http.Status][`code`]
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
