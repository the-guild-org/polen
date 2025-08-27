import type { ReactRouter } from '#dep/react-router/index'
import type { React } from '#dep/react/index'

export type RouteObjectIndexInput = RouteObjectIndexInputConfig | React.ComponentType
export type RouteObjectIndexInputConfig = Omit<ReactRouter.IndexRouteObject, 'index' | 'children'>

/**
 * Helper to create an index route configuration
 * @param input - Either a component or a route configuration object
 * @returns An index route object
 */
export const routeIndex = (
  input: RouteObjectIndexInput,
): ReactRouter.IndexRouteObject => {
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