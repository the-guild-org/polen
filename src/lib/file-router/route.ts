import type { Path } from '@wollybeard/kit'

export type RoutePathSegment = string

export interface RoutePath {
  segments: RoutePathSegment[]
}

export interface RouteFile {
  path: {
    relative: Path.Parsed
    absolute: Path.Parsed
  }
}

export interface Route {
  path: RoutePath
  file: RouteFile
}

export const sep = `/`

export const routeToString = (route: Route) => {
  return sep + route.path.segments.join(sep)
}

export const routeIsIndex = (route: Route) => {
  return route.file.path.relative.name === conventions.index.name
}

const conventions = {
  index: {
    name: `index`,
  },
}
