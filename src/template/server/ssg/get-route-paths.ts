import { Grafaid } from '#lib/grafaid'
import { visit } from 'graphql'
// Or your specific import path for this type
import { ReactRouterAid } from '#lib/react-router-aid'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import { routes } from '../../routes.jsx'

// todo: Frameworks tend to colocate ssg data loaders with routes to solve the following
// problem which is we have to map data loaders to paramterized routes.
// Maybe we can figure something out too.
const knownParameterizedRouteExpressions = {
  reference_type: `/reference/:type`,
}

export const getRoutesPaths = (): string[] => {
  const paths = new Set<string>()
  const routeExpressions = ReactRouterAid.getRouteExpressions(routes)

  for (const exp of routeExpressions) {
    if (exp === knownParameterizedRouteExpressions.reference_type) {
      if (PROJECT_DATA.schema) {
        const schema = PROJECT_DATA.schema.versions[0].after
        const ast = Grafaid.Schema.AST.parse(Grafaid.Schema.print(schema))
        visit(ast, {
          NamedType(typeNode) {
            paths.add(`/reference/${typeNode.name.value}`)
          },
        })
      }
    } else if (ReactRouterAid.isParameterizedPath(exp)) {
      throw new Error(`Unhandled parameterized path: ${exp}`)
    } else {
      // Static path
      paths.add(exp)
    }
  }

  return Array.from(paths).sort() // Sort for deterministic output
}
