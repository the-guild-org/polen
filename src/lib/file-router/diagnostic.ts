import { Arr, Path, Rec } from '@wollybeard/kit'
import { type Route, type RouteFile, routeIsIndex, routeToString as routeToString } from './route.js'

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

  const seenLookup = Rec.create<{ index: number; route: Route }>()
  const seen = Arr.create<Route>()

  // ━ Check for conflict between index and literal.
  //   Note: There is no other way for paths to conflict so we safely assuming the cause is index+literal.
  for (const route of routes) {
    // Detect
    const key = routeToString(route)
    const seenLookupItem = seenLookup[key]

    if (seenLookupItem) {
      // Fix - ignore the index
      const [index, literal] = routeIsIndex(route) ? [route, seenLookupItem.route] : [seenLookupItem.route, route]
      if (seenLookupItem.route === index) {
        seenLookupItem.route = literal
        seen.splice(seenLookupItem.index, 1, index)
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
    const index = seen.push(route)
    seenLookup[key] = { route, index }
  }

  return {
    diagnostics,
    routes: seen,
  }
}
