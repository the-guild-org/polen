import { Grafaid } from '#lib/grafaid/index.js'
import { visit } from 'graphql'
// Or your specific import path for this type
import { ReactRouterAid } from '#lib/react-router-aid/index.js'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import { routes } from '../../routes.jsx'

export const getRoutesPaths = (): string[] => {
  const paths = new Set<string>()
  const routeExpressions = ReactRouterAid.getRouteExpressions(routes)

  for (const exp of routeExpressions) {
    if (exp.includes(`:`)) {
      // Handle dynamic segments
      if (exp.startsWith(`/reference/`) && exp.includes(`:type`)) {
        if (PROJECT_DATA.schema) {
          const schema = PROJECT_DATA.schema.versions[0].after
          const ast = Grafaid.Schema.AST.parse(Grafaid.Schema.print(schema))
          visit(ast, {
            NamedType(typeNode) {
              paths.add(`/reference/${typeNode.name.value}`)
            },
          })
        }
        // The base path (e.g., /reference) if it's a navigable route on its own
        // (e.g. has an index child or its own component) would have been added
        // as a separate static pattern by extractPathsFromRouteObjects.
      } // TODO: Add handlers for other known dynamic patterns if they exist,
      // for example, if 'virtual:polen/project/pages.jsx' introduces routes like '/blog/:slug'.
      // else if (pattern.startsWith('/blog/') && pattern.includes(':slug')) {
      //   // Fetch all slugs and generate paths: collectedPathsForSSG.add(`/blog/my-post`);
      // }
      else if (!exp.startsWith(`/reference/`)) { // Avoid double warning for :type if no schema
        // Log unhandled dynamic patterns as they won't be SSG'd by default
        // unless specific data fetching logic is added for them.
        console.warn(
          `[SSG] Note: Dynamic path pattern "${exp}" found. Implement data fetching to generate concrete paths.`,
        )
      }
    } else {
      // Static path, add directly
      paths.add(exp)
    }
  }

  return Array.from(paths).sort() // Sort for deterministic output
}
