import { Path } from '../lib-dep/path/index.js'
import { casesHandled } from '../lib/prelude/main.js'

const indexRegex = /\/index\.\w+$/

export interface RoutePath {
  raw: string
  segments: string[]
}

export type Route = RouteIndex | RouteSegment | RouteItem

export interface RouteItem {
  type: `RouteItem`
  pathExplicit: string
  path: RoutePath
}

export interface RouteIndex {
  type: `RouteIndex`
  pathExplicit: string
  path: RoutePath
  // isIndex: boolean
}

export interface RouteSegment {
  type: `RouteSegment`
  pathExplicit: string
  path: RoutePath
}

export const filePathToPageRoute = (filePath: string, rootDir: string): RouteIndex | RouteItem => {
  const filePathWithoutRoot = Path.relative(rootDir, filePath)
  const fileExt = Path.extname(filePathWithoutRoot)
  const dir = Path.dirname(filePathWithoutRoot)
  const isIndex = indexRegex.test(filePathWithoutRoot)
  const routePathExplicit = Path.join(dir, Path.basename(filePathWithoutRoot, fileExt))
  const routePath = isIndex ? dir : routePathExplicit
  const route: RouteIndex | RouteItem = {
    type: isIndex ? `RouteIndex` : `RouteItem`,
    pathExplicit: routePathExplicit,
    path: {
      raw: routePath,
      segments: routePath.split(pathSegmentSeparator),
    },
  }
  return route
}

export const pathSegmentSeparator = `/`

export const isRouteTopLevel = (route: Route): boolean =>
  isRoutePathRoot(calcParentRoutePath(route).raw)

export const calcParentRoutePath = (route: Route): RoutePath => {
  switch (route.type) {
    case `RouteIndex`:
      return route.path
    case `RouteItem`:
    case `RouteSegment`:
      const segments = route.path.segments.slice(0, -1)
      const raw = segments.join(pathSegmentSeparator)
      return {
        segments,
        raw,
      }
    default:
      return casesHandled(route)
  }
}

export const isRoutePathRoot = (routePath: string): boolean => routePath === ``
