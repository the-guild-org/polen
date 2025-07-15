import { Api } from '#api/index'
import { ReactRouterAid } from '#lib/react-router-aid/index'
import { visit } from 'graphql'
import * as NodeFs from 'node:fs/promises'
import * as NodePath from 'node:path'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { routes } from '../../routes.js'

// todo: Frameworks tend to colocate ssg data loaders with routes to solve the following
// problem which is we have to map data loaders to paramterized routes.
// Maybe we can figure something out too.
const knownParameterizedRouteExpressions = {
  reference_type: `/reference/:type`,
  reference_versioned_type: `/reference/version/:version/:type`,
}

export const getRoutesPaths = async (): Promise<string[]> => {
  const paths = new Set<string>()
  const routeExpressions = ReactRouterAid.getRouteExpressions(routes)

  // Helper function to load schema from filesystem and add type paths
  const addTypePathsForVersion = async (version: string, pathPrefix: string) => {
    try {
      const schemaFilePath = NodePath.join(PROJECT_DATA.paths.absolute.build.assets.schemas, `${version}.json`)
      const schemaContent = await NodeFs.readFile(schemaFilePath, 'utf-8')
      const schemaAst = JSON.parse(schemaContent)

      visit(schemaAst, {
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
    } catch (error) {
      throw new Error(`SSG failed to load schema for version ${version}. Ensure schema assets are built. ${error}`)
    }
  }

  const schemaMetadataPath = NodePath.join(PROJECT_DATA.paths.absolute.build.assets.schemas, 'metadata.json')

  const schemaMetadata = await Api.Schema.getMetadata(schemaMetadataPath)
  const { hasSchema, versions: availableVersions } = schemaMetadata

  for (const exp of routeExpressions) {
    if (exp === knownParameterizedRouteExpressions.reference_type) {
      if (hasSchema) {
        // Add paths for latest version (no version in URL)
        await addTypePathsForVersion(Api.Schema.VERSION_LATEST, `/reference`)
      }
    } else if (exp === knownParameterizedRouteExpressions.reference_versioned_type) {
      if (hasSchema) {
        // Add paths for all versions using new route structure
        for (const version of availableVersions) {
          await addTypePathsForVersion(version, `/reference/version/${version}`)
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
