import { Api } from '#api/$'
import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'
import { Vite } from '#dep/vite/index'
import { FileRouter } from '#lib/file-router/$'
import { debugPolen } from '#singletons/debug'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import consola from 'consola'
import { isInterfaceType, isObjectType } from 'graphql'
import { Catalog, SchemaDefinition, Version } from 'graphql-kit'

/**
 * Vite plugin that generates a routes manifest during build for SSG.
 * This manifest contains all concrete route paths (no parameters)
 * that the SSG process needs to generate.
 */
export const RoutesManifest = (config: Api.Config.Config): Vite.Plugin => {
  const debug = debugPolen.sub(`vite:routes-manifest`)

  return {
    name: `polen:routes-manifest`,
    apply: `build`,
    applyToEnvironment: Vite.isEnvironmentSsr,
    async closeBundle() {
      const routes: string[] = []

      // Add base routes
      routes.push('/')
      routes.push('/changelog')

      // Check if schema exists using configured sources
      const schemaExists = await Ef.runPromise(
        Api.Schema.hasSchema(config).pipe(
          Ef.provide(NodeFileSystem.layer),
        ),
      )

      if (schemaExists) {
        // Load catalog data
        const catalogData = await Ef.runPromise(
          Api.Schema.loadOrThrow(config).pipe(
            Ef.provide(NodeFileSystem.layer),
          ),
        )

        if (Op.isSome(catalogData)) {
          const catalog = catalogData.value.data
          routes.push('/reference')

          // Process catalog using fold
          if (Op.isSome(catalog)) {
            Catalog.fold(
              (versioned) => processVersionedCatalog(versioned, routes),
              (unversioned) => processUnversionedCatalog(unversioned, routes),
            )(catalog.value)
          }
        }
      }

      // Add arbitrary page routes
      const pagesScaleResult = await Ef.runPromise(
        Api.Content.scan({
          dir: config.paths.project.absolute.pages,
        }).pipe(Ef.provide(NodeFileSystem.layer)),
      )

      if (pagesScaleResult.list.length > 0) {
        debug('Processing arbitrary pages', { count: pagesScaleResult.list.length })
        for (const page of pagesScaleResult.list) {
          const pathExp = FileRouter.routeToPathExpression(page.route)
          routes.push(pathExp)
          debug('added page route', { path: pathExp })
        }
      }

      // Write manifest using the new Routes API
      await Ef.runPromise(
        Api.Routes.Manifest.write(
          {
            version: `1.0.0`,
            timestamp: new Date().toISOString(),
            totalRoutes: routes.length,
            routes: routes.sort(), // Sort for deterministic output
          },
          config.paths.project.absolute.build.assets.root,
        ).pipe(
          Ef.provide(NodeFileSystem.layer),
        ),
      )

      consola.success(`Generated routes manifest with ${routes.length} routes`)
      debug(`Routes manifest written`, {
        totalRoutes: routes.length,
        path: config.paths.project.absolute.build.assets.root,
      })
    },
  }
}

function processVersionedCatalog(
  catalog: Catalog.Versioned,
  routes: string[],
): void {
  for (const schema of Catalog.Versioned.getAll(catalog)) {
    const version = schema.version
    // Properly encode the version to its string representation
    const versionValue = Version.encodeSync(version)
    routes.push(`/reference/version/${versionValue}`)

    processSchemaDefinition(
      schema.definition,
      routes,
      `/reference/version/${versionValue}`,
    )
  }
}

function processUnversionedCatalog(
  catalog: Catalog.Unversioned,
  routes: string[],
): void {
  // Process schema definition if it exists
  if (catalog.schema.definition) {
    processSchemaDefinition(catalog.schema.definition, routes, '/reference')
  }
}

function processSchemaDefinition(
  definition: SchemaDefinition.SchemaDefinition,
  routes: string[],
  basePath: string,
): void {
  // SchemaDefinition is a GraphQLSchema instance
  const typeMap = definition.getTypeMap()

  for (const [typeName, type] of Object.entries(typeMap)) {
    // Skip introspection types
    if (typeName.startsWith('__')) continue

    routes.push(`${basePath}/${typeName}`)

    // Handle fields for object and interface types
    if (isObjectType(type) || isInterfaceType(type)) {
      const fields = type.getFields()
      for (const fieldName of Object.keys(fields)) {
        routes.push(`${basePath}/${typeName}/${fieldName}`)
      }
    }
  }
}
