import { A } from '#dep/effect'
import type { ReactRouter } from '#dep/react-router/index'

const sep = `/`

const ROOT_PATH = sep

const EMPTY_PATH = ``

const isRootPath = (path: string) => {
  return path === ROOT_PATH
}

/**
 * Extracts unique path patterns from a React Router configuration.
 * @param routes - An array of RouteObject.
 * @returns An array of unique path patterns.
 */
export const getRouteExpressions = (
  routes: ReactRouter.RouteObject[],
): string[] => {
  const collectedPaths = new Set<string>()
  _getPathsRecurse(routes, EMPTY_PATH, collectedPaths)
  return A.fromIterable(collectedPaths)
}

/**
 * Recursively populates a set with path patterns from a React Router configuration.
 * @param routes - An array of RouteObject.
 * @param parentPath - The accumulated path from parent routes.
 * @param collectedPaths - The Set to populate with unique path patterns.
 */
export const _getPathsRecurse = (
  routes: ReactRouter.RouteObject[],
  parentPath: string,
  collectedPaths: Set<string>,
): void => {
  for (const route of routes) {
    const isTopLevel = parentPath === EMPTY_PATH || parentPath === ROOT_PATH

    // Index Route
    if (isIndexRoute(route)) {
      // Index route uses the parent's accumulated path.
      // If parentPath is empty (implying root), it should be ROOT_PATH
      collectedPaths.add(parentPath ?? ROOT_PATH)

      continue
    }

    // Layout-Only Route
    // If a route has no 'path' and is not 'index', it's a layout-only route.
    // 'pathForChildren' remains 'parentPath' for its children.
    if (isLayoutOnlyRoute(route)) {
      // nothing to do
      if (route.children && route.children.length > 0) {
        _getPathsRecurse(route.children, parentPath, collectedPaths)
      }
      continue
    }

    const segment = route.path!
    const path = normalizePath(isTopLevel ? `${sep}${segment}` : `${parentPath}${sep}${segment}`)
    collectedPaths.add(path)

    if (route.children && route.children.length > 0) {
      _getPathsRecurse(route.children, path, collectedPaths)
    }
  }
}

export type LayoutOnlyRoute = ReactRouter.NonIndexRouteObject & { path?: undefined }

export type NonLayoutOnlyNonIndexRoute = ReactRouter.NonIndexRouteObject & { path: string }

export const isIndexRoute = (route: ReactRouter.RouteObject): route is ReactRouter.IndexRouteObject => {
  return route.index === true
}

export const isLayoutOnlyRoute = (route: ReactRouter.RouteObject): route is LayoutOnlyRoute => {
  return route.path === undefined && !isIndexRoute(route)
}

export const isNonLayoutOnlyRoute = (route: ReactRouter.RouteObject): route is NonLayoutOnlyNonIndexRoute => {
  return !isLayoutOnlyRoute(route)
}

export const normalizePath = (path: string) => {
  // Normalize: remove multiple slashes (e.g. // -> /)
  path = path.replace(/\/\/+/g, sep)

  // Normalize: remove trailing slash unless it's the root path itself
  if (!isRootPath(path) && path.endsWith(sep)) {
    path = path.slice(0, -1)
  }

  // If normalization resulted in an empty path, it should be treated as the root path.
  if (path === EMPTY_PATH) {
    path = ROOT_PATH
  }

  return path
}

export const isParameterizedPath = (path: string): boolean => {
  return path.includes(`:`)
}
