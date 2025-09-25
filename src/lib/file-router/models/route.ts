import { S } from '#dep/effect'
import { FsLoc } from '@wollybeard/kit'
import { Context, Effect, ParseResult } from 'effect'
import type * as _ from 'effect/SchemaAST'
import { RouteLogical } from './route-logical.js'

// ============================================================================
// CONSTANTS
// ============================================================================

const conventions = {
  index: {
    name: `index`,
  },
}

// ============================================================================
// SCHEMA AND TYPE
// ============================================================================

export class Route extends S.Class<Route>('Route')({
  logical: RouteLogical,
  file: FsLoc.AbsFile,
}) {
  get id(): string {
    return S.encodeSync(FsLoc.Path.Abs.String)(this.logical.path)
  }

  static is = S.is(Route)

  // ============================================================================
  // TYPE GUARDS
  // ============================================================================

  /**
   * Route is top level meaning exists directly under the root.
   *
   * It excludes the root level route.
   */
  static isTopLevel = (route: Route): route is TopLevelRoute => {
    return FsLoc.Path.isTop(route.logical.path)
  }

  /**
   * Route is not top or root level
   */
  static isSubLevel = (route: Route): route is RouteSubLevel => {
    return FsLoc.Path.isSub(route.logical.path)
  }

  /**
   * Route is the singular root route.
   *
   * This is the case of index under root.
   */
  static isRootLevel = (route: Route): route is TopLevelRoute => {
    // No need to check for name "index"
    // Segments is uniquely empty for <root>/index
    return FsLoc.Path.isRoot(route.logical.path)
  }

  // ============================================================================
  // STATE PREDICATES
  // ============================================================================

  static isFromIndexFile = (route: Route): boolean => {
    const fileName = FsLoc.name(route.file)
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
    return nameWithoutExt === conventions.index.name
  }

  static isSubOf = (route: Route, potentialAncestorPath: FsLoc.Path.Abs): boolean => {
    return FsLoc.Path.isDescendantOf(route.logical.path, potentialAncestorPath)
  }

  // ============================================================================
  // EXPORTERS
  // ============================================================================

  static toPathExpression = (route: Route) => {
    return route.id
  }

  // ============================================================================
  // DOMAIN LOGIC
  // ============================================================================

  /**
   * You are responsible for ensuring given ancestor path is really an ancestor of given route's path.
   */
  static makeRelativeUnsafe = (route: Route, assumedAncestorPath: FsLoc.Path.Abs): Route => {
    // We assume that we're working with paths where index is elided per our FileRouter system.
    const relativeSegments = FsLoc.Path.getRelativeSegments(route.logical.path, assumedAncestorPath)
    if (!relativeSegments) {
      // This shouldn't happen if caller ensures ancestor relationship, but handle gracefully
      return route
    }
    const newPath = FsLoc.Path.Abs.make({ segments: relativeSegments })
    return Route.make({
      ...route,
      logical: RouteLogical.make({
        ...route.logical,
        path: newPath,
      }),
    })
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Context tag for Route transformations that need a root directory
 */
export class RouteContext extends Context.Tag('RouteContext')<
  RouteContext,
  { readonly rootDir: FsLoc.AbsDir }
>() {}

// ============================================================================
// CODECS
// ============================================================================

/**
 * Schema for transforming from AbsFile to Route.
 * Requires RouteContext with rootDir to be provided.
 */
export const RouteFromAbsFile = S.transformOrFail(
  FsLoc.AbsFile,
  Route,
  {
    decode: (_file, _options, _ast, _fromI) =>
      Effect.gen(function*() {
        const file = _file // Avoid shadowing in inner scope
        const { rootDir } = yield* RouteContext
        const relativePath = FsLoc.toRel(file, rootDir)
        const logical = S.decodeSync(RouteLogical.FromRelFile)(relativePath)
        return Route.make({
          logical,
          file,
        })
      }),
    encode: (_toI, _options, _ast, route) => ParseResult.succeed(route.file),
  },
)

// ============================================================================
// SPECIALIZED TYPES
// ============================================================================

// For now, using type aliases for specialized routes
// since we can't override fields in Effect Schema extends
export type TopLevelRoute = Route & { logical: RouteLogical }
export type RouteSubLevel = Route & { logical: RouteLogical }
