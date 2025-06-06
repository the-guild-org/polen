import { arrayEquals } from '#lib/kit-temp.js'
import { type Path } from '@wollybeard/kit'

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Path
//
//

export type Path = PathSegment[]

export type PathRoot = []

export type PathTop = [PathSegment]

export type PathSub = [PathSegment, PathSegment, ...PathSegment[]]

export type PathSegment = string

export const sep = `/`

export const pathToExpression = (path: Path) => {
  return sep + path.join(sep)
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Route (Generic)
//
//

export interface Route {
  logical: RouteLogical
  file: RouteFile
}

export interface RouteLogical {
  path: Path
}

export interface RouteFile {
  path: {
    relative: Path.Parsed
    absolute: Path.Parsed
  }
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Top Level Route
//
//

export interface TopLevelRoute extends Route {
  logical: TopLevelRouteLogical
}

export interface TopLevelRouteLogical {
  path: PathTop
}

/**
 * Route is top level meaning exists directly under the root.
 *
 * It excludes the root level route.
 */
export const routeIsTopLevel = (route: Route): route is TopLevelRoute => {
  return route.logical.path.length === 1
}

//
// ━━ Sub Level
//

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Sub Level Route
//
//

export interface RouteSubLevel extends Route {
  logical: RoutePathSubLevel
}

export interface RoutePathSubLevel {
  path: PathSub
}

/**
 * Route is not top or root level
 */
export const routeIsSubLevel = (route: Route): route is RouteSubLevel => {
  return route.logical.path.length > 1
}

//
// ━━ Root Level
//

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Root Level Route
//
//

/**
* Route is the singular root route.

* This is the case of index under root.
*/
export const routeIsRootLevel = (route: Route): route is TopLevelRoute => {
  // No need to check for name "index"
  // Segments is uniquely empty for <root>/index
  return route.logical.path.length === 0
}

//
//
//
// ━━━━━━━━━━━━━━ • Route Functions
//
//

export const routeIsFromIndexFile = (route: Route): boolean => {
  return route.file.path.relative.name === conventions.index.name
}

export const routeIsSubOf = (route: Route, potentialAncestorPath: PathSegment[]): boolean => {
  if (route.logical.path.length <= potentialAncestorPath.length) {
    return false
  }
  return arrayEquals(
    route.logical.path.slice(0, potentialAncestorPath.length),
    potentialAncestorPath,
  )
}

/**
 * You are responsible for ensuring given ancestor path is really an ancestor of given route's path.
 */
export const makeRelativeUnsafe = (route: Route, assumedAncestorPath: PathSegment[]): Route => {
  // We assume that we're working with paths where index is elided per our FileRouter system.
  const newPath = route.logical.path.slice(assumedAncestorPath.length)
  return {
    ...route,
    logical: {
      ...route.logical,
      path: newPath,
    },
  }
}

export const routeToPathExpression = (route: Route) => {
  return pathToExpression(route.logical.path)
}

const conventions = {
  index: {
    name: `index`,
  },
}
