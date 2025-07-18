import { Api } from '#api/index'
import { ReactRouterAid } from '#lib/react-router-aid'
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
  reference_type_field: `/reference/:type/:field`,
  reference_version: `/reference/version/:version`,
  reference_versioned_type: `/reference/version/:version/:type`,
  reference_versioned_type_field: `/reference/version/:version/:type/:field`,
}

export const getRoutesPaths = async (): Promise<string[]> => {
  const paths = new Set<string>()
  const routeExpressions = ReactRouterAid.getRouteExpressions(routes)

  // Helper function to load schema from filesystem and add type paths
  const addTypePathsForVersion = async (version: string, includeFields = false) => {
    try {
      const schemaFilePath = NodePath.join(PROJECT_DATA.paths.project.absolute.build.assets.schemas, `${version}.json`)
      const schemaContent = await NodeFs.readFile(schemaFilePath, 'utf-8')
      const schemaAst = JSON.parse(schemaContent)

      visit(schemaAst, {
        ObjectTypeDefinition(node) {
          const typePath = Api.Schema.Routing.createReferencePath({
            version: version === Api.Schema.VERSION_LATEST ? undefined : version,
            type: node.name.value,
          })
          paths.add(typePath)

          // Add field paths if requested
          if (includeFields && node.fields) {
            for (const field of node.fields) {
              const fieldPath = Api.Schema.Routing.createReferencePath({
                version: version === Api.Schema.VERSION_LATEST ? undefined : version,
                type: node.name.value,
                field: field.name.value,
              })
              paths.add(fieldPath)
            }
          }
        },
        InterfaceTypeDefinition(node) {
          const typePath = Api.Schema.Routing.createReferencePath({
            version: version === Api.Schema.VERSION_LATEST ? undefined : version,
            type: node.name.value,
          })
          paths.add(typePath)

          // Add field paths if requested
          if (includeFields && node.fields) {
            for (const field of node.fields) {
              const fieldPath = Api.Schema.Routing.createReferencePath({
                version: version === Api.Schema.VERSION_LATEST ? undefined : version,
                type: node.name.value,
                field: field.name.value,
              })
              paths.add(fieldPath)
            }
          }
        },
        EnumTypeDefinition(node) {
          const typePath = Api.Schema.Routing.createReferencePath({
            version: version === Api.Schema.VERSION_LATEST ? undefined : version,
            type: node.name.value,
          })
          paths.add(typePath)
        },
        InputObjectTypeDefinition(node) {
          const typePath = Api.Schema.Routing.createReferencePath({
            version: version === Api.Schema.VERSION_LATEST ? undefined : version,
            type: node.name.value,
          })
          paths.add(typePath)
        },
        UnionTypeDefinition(node) {
          const typePath = Api.Schema.Routing.createReferencePath({
            version: version === Api.Schema.VERSION_LATEST ? undefined : version,
            type: node.name.value,
          })
          paths.add(typePath)
        },
        ScalarTypeDefinition(node) {
          const typePath = Api.Schema.Routing.createReferencePath({
            version: version === Api.Schema.VERSION_LATEST ? undefined : version,
            type: node.name.value,
          })
          paths.add(typePath)
        },
      })
    } catch (error) {
      throw new Error(`SSG failed to load schema for version ${version}. Ensure schema assets are built. ${error}`)
    }
  }

  const schemaMetadataPath = NodePath.join(PROJECT_DATA.paths.project.absolute.build.assets.schemas, 'metadata.json')

  const schemaMetadata = await Api.Schema.getMetadata(schemaMetadataPath)
  const { hasSchema, versions: availableVersions } = schemaMetadata

  for (const exp of routeExpressions) {
    if (exp === knownParameterizedRouteExpressions.reference_type) {
      if (hasSchema) {
        // Add paths for latest version (no version in URL)
        await addTypePathsForVersion(Api.Schema.VERSION_LATEST)
      }
    } else if (exp === knownParameterizedRouteExpressions.reference_version) {
      if (hasSchema) {
        // Add paths for version pages themselves (without type)
        for (const version of availableVersions) {
          const versionPath = Api.Schema.Routing.createReferenceBasePath(version)
          paths.add(versionPath)
        }
      }
    } else if (exp === knownParameterizedRouteExpressions.reference_type_field) {
      if (hasSchema) {
        // Add paths for latest version fields
        await addTypePathsForVersion(Api.Schema.VERSION_LATEST, true)
      }
    } else if (exp === knownParameterizedRouteExpressions.reference_versioned_type) {
      if (hasSchema) {
        // Add paths for all versions using new route structure
        for (const version of availableVersions) {
          await addTypePathsForVersion(version)
        }
      }
    } else if (exp === knownParameterizedRouteExpressions.reference_versioned_type_field) {
      if (hasSchema) {
        // Add paths for all versions with fields
        for (const version of availableVersions) {
          await addTypePathsForVersion(version, true)
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
