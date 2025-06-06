import { Idx, Path } from '@wollybeard/kit'
import { type Route, type RouteFile, routeIsFromIndexFile, routeToPathExpression } from './route.js'

export type Diagnostic = DiagnosticIndexConflict

export interface DiagnosticIndexConflict {
  message: string
  literal: {
    file: RouteFile
  }
  index: {
    file: RouteFile
  }
}

export interface LintResult {
  diagnostics: Diagnostic[]
  routes: Route[]
}

export const lint = (routes: Route[]): LintResult => {
  const diagnostics: Diagnostic[] = []

  const seen = Idx.create({ key: routeToPathExpression })

  // ━ Check for conflict between index and literal.
  //   Note: There is no other way for paths to conflict so we safely assuming the cause is index+literal.
  for (const route of routes) {
    // Detect
    const seenRoute = seen.get(route)

    if (seenRoute) {
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
