// import { neverCase } from '@wollybeard/kit/language'

// export interface RoutePath {
//   raw: string
//   segments: string[]
// }

// export type Route = RouteIndex | RouteSegment | RouteItem

// export interface RouteItem {
//   type: `RouteItem`
//   pathExplicit: string
//   path: RoutePath
// }

// export interface RouteIndex {
//   type: `RouteIndex`
//   pathExplicit: string
//   path: RoutePath
//   // isIndex: boolean
// }

// export interface RouteSegment {
//   type: `RouteSegment`
//   pathExplicit: string
//   path: RoutePath
// }

// export const segmentSeparator = `/`

// export const isRouteTopLevel = (route: Route): boolean => isRoutePathRoot(calcParentRoutePath(route).raw)

// export const calcParentRoutePath = (route: Route): RoutePath => {
//   switch (route.type) {
//     case `RouteIndex`:
//       return route.path
//     case `RouteItem`:
//     case `RouteSegment`:
//       const segments = route.path.segments.slice(0, -1)
//       const raw = segments.join(segmentSeparator)
//       return {
//         segments,
//         raw,
//       }
//     default:
//       return neverCase(route)
//   }
// }

// export const isRoutePathRoot = (routePath: string): boolean => routePath === ``
