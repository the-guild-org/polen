import type { ReactRouter } from '#dep/react-router/index'
import type { React } from '#dep/react/index'
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

export const route = <routeObject extends RouteObject>(
  routeObject: routeObject,
): routeObject => {
  return {
    ...routeObject,
  }
}

export type RouteObjectIndexInput = RouteObjectIndexInputConfig | React.ComponentType
export type RouteObjectIndexInputConfig = Omit<RouteObjectIndex, `index` | `children`>

export const routeIndex = (
  input: RouteObjectIndexInput,
): RouteObjectIndex => {
  const routeConfig: RouteObjectIndexInputConfig = isComponentType(input) ? { Component: input } : input
  return {
    ...routeConfig,
    index: true,
    children: undefined,
  }
}

const isComponentType = (value: unknown): value is React.ComponentType => {
  return typeof value === 'function'
}
