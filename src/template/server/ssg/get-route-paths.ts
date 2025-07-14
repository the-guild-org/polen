import { Grafaid } from '#lib/grafaid/index'
import { ReactRouterAid } from '#lib/react-router-aid/index'
import { visit } from 'graphql'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { dateToVersionString, VERSION_LATEST } from '../../lib/schema-utils/constants.js'
import { routes } from '../../routes.js'

// todo: Frameworks tend to colocate ssg data loaders with routes to solve the following
// problem which is we have to map data loaders to paramterized routes.
// Maybe we can figure something out too.
const knownParameterizedRouteExpressions = {
  reference_type: `/reference/:type`,
  reference_versioned_type: `/reference/version/:version/:type`,
}

export const getRoutesPaths = (): string[] => {
  const paths = new Set<string>()
  const routeExpressions = ReactRouterAid.getRouteExpressions(routes)

  // Helper function to add all type paths for a given schema
  const addTypePathsForSchema = (schema: any, pathPrefix: string) => {
    const ast = Grafaid.Schema.AST.parse(Grafaid.Schema.print(schema))
    visit(ast, {
      ObjectTypeDefinition(node) {
        paths.add(`${pathPrefix}/${node.name.value}`)
      },
      InterfaceTypeDefinition(node) {
        paths.add(`${pathPrefix}/${node.name.value}`)
      },
      EnumTypeDefinition(node) {
        paths.add(`${pathPrefix}/${node.name.value}`)
      },
      InputObjectTypeDefinition(node) {
        paths.add(`${pathPrefix}/${node.name.value}`)
      },
      UnionTypeDefinition(node) {
        paths.add(`${pathPrefix}/${node.name.value}`)
      },
      ScalarTypeDefinition(node) {
        paths.add(`${pathPrefix}/${node.name.value}`)
      },
    })
  }

  for (const exp of routeExpressions) {
    if (exp === knownParameterizedRouteExpressions.reference_type) {
      if (PROJECT_DATA.schema) {
        // Add paths for latest version (no version in URL)
        const latestSchema = PROJECT_DATA.schema.versions[0].after
        addTypePathsForSchema(latestSchema, `/reference`)
      }
    } else if (exp === knownParameterizedRouteExpressions.reference_versioned_type) {
      if (PROJECT_DATA.schema) {
        // Add paths for all versions using new route structure
        for (const [index, version] of PROJECT_DATA.schema.versions.entries()) {
          const versionName = index === 0 ? VERSION_LATEST : dateToVersionString(version.date)
          addTypePathsForSchema(version.after, `/reference/version/${versionName}`)
        }
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
