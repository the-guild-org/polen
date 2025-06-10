import { Idx, Path } from '@wollybeard/kit'
import { type Route, type RouteFile, routeIsFromIndexFile, routeToPathExpression } from './route.ts'

export type Diagnostic = DiagnosticIndexConflict | DiagnosticNumberedPrefixConflict | DiagnosticNumberedPrefixOnIndex

export interface DiagnosticIndexConflict {
  message: string
  literal: {
    file: RouteFile
  }
  index: {
    file: RouteFile
  }
}

export interface DiagnosticNumberedPrefixConflict {
  message: string
  kept: {
    file: RouteFile
    order: number
  }
  dropped: {
    file: RouteFile
    order: number
  }
}

export interface DiagnosticNumberedPrefixOnIndex {
  message: string
  file: RouteFile
  order: number
}

export interface LintResult {
  diagnostics: Diagnostic[]
  routes: Route[]
}

export const lint = (routes: Route[]): LintResult => {
  const diagnostics: Diagnostic[] = []

  const seen = Idx.create({ key: routeToPathExpression })

  // ━ Check for numbered prefix on index files
  for (const route of routes) {
    if (routeIsFromIndexFile(route) && route.logical.order !== undefined) {
      const diagnostic: DiagnosticNumberedPrefixOnIndex = {
        message: `Numbered prefix on index file has no effect. The file:\n  ${
          Path.format(route.file.path.relative)
        }\n\nhas a numbered prefix (${route.logical.order}_) which doesn't affect ordering since index files represent their parent directory.`,
        file: route.file,
        order: route.logical.order,
      }
      diagnostics.push(diagnostic)
    }
  }

  // ━ Check for conflicts
  for (const route of routes) {
    // Detect
    const seenRoute = seen.get(route)

    if (seenRoute) {
      // Check if it's a numbered prefix conflict
      if (seenRoute.logical.order !== undefined && route.logical.order !== undefined) {
        // Handle numbered prefix conflict - keep the one with higher order
        const [kept, dropped] = seenRoute.logical.order > route.logical.order ? [seenRoute, route] : [route, seenRoute]

        if (dropped === seenRoute) {
          seen.set(kept)
        }

        const orderMessage = kept.logical.order === dropped.logical.order
          ? `Both files have the same order number (${kept.logical.order}). The file processed later is being kept based on processing order.`
          : `The file with lower order number (${dropped.logical.order}) is being dropped in favor of the one with higher order (${kept.logical.order}).`

        const diagnostic: DiagnosticNumberedPrefixConflict = {
          // dprint-ignore
          message: `Your files represent conflicting routes due to numbered prefixes. This file:\n  ${Path.format(kept.file.path.relative)}\n\nconflicts with this file:\n\n  ${Path.format(dropped.file.path.relative)}.\n\n${orderMessage}`,
          kept: {
            file: kept.file,
            order: kept.logical.order!,
          },
          dropped: {
            file: dropped.file,
            order: dropped.logical.order!,
          },
        }
        diagnostics.push(diagnostic)
        continue
      }

      // Fix - ignore the index
      const [index, literal] = routeIsFromIndexFile(route) ? [route, seenRoute] : [seenRoute, route]
      if (seenRoute === index) {
        seen.set(route)
      }

      // Report
      const diagnostic: DiagnosticIndexConflict = {
        // dprint-ignore
        message: `Your files represent conflicting routes. This index file route:\n  ${Path.format(index.file.path.relative)}\n\nconflicts with this literal file route:\n\n  ${Path.format(literal.file.path.relative)}.\n\nYour index route is being ignored.`,
        literal: {
          file: literal.file,
        },
        index: {
          file: index.file,
        },
      }
      diagnostics.push(diagnostic)

      continue
    }

    // Continue
    seen.set(route)
  }

  return {
    diagnostics,
    routes: seen.toArray(),
  }
}
