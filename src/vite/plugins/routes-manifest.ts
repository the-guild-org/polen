import type { Config } from '#api/config/index'
import { Api } from '#api/index'
import { Vite } from '#dep/vite/index'
import { Catalog } from '#lib/catalog/$'
import { SchemaDefinition } from '#lib/schema-definition/$'
import { debugPolen } from '#singletons/debug'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import consola from 'consola'
import { Effect } from 'effect'
import { isInterfaceType, isObjectType } from 'graphql'
import * as fs from 'node:fs/promises'

/**
 * Vite plugin that generates a routes manifest during build for SSG.
 * This manifest contains all concrete route paths (no parameters)
 * that the SSG process needs to generate.
 */
export const RoutesManifest = (config: Config.Config): Vite.Plugin => {
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
      const schemaExists = await Effect.runPromise(
        Api.Schema.hasSchema(config).pipe(
          Effect.provide(NodeFileSystem.layer),
        ),
      )

      if (schemaExists) {
        // Load catalog data
        const catalogData = await Effect.runPromise(
          Api.Schema.loadOrThrow(config).pipe(
            Effect.provide(NodeFileSystem.layer),
          ),
        )

        const catalog = catalogData?.data

        if (catalog) {
          routes.push('/reference')

          // Process catalog using fold
          Catalog.fold(
            (versioned) => processVersionedCatalog(versioned, routes),
            (unversioned) => processUnversionedCatalog(unversioned, routes),
          )(catalog)
        }
      }

      // Add custom page routes
      const pagesDir = config.paths.project.absolute.pages
      try {
        await fs.access(pagesDir)
        // TODO: Scan pages directory and add routes
        // For now, we'll leave this as a future enhancement
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          debug('Pages directory not found, skipping custom page routes:', pagesDir)
        } else {
          throw err // Let unexpected errors bubble up
        }
      }

      // Write manifest using the new Routes API
      await Api.Routes.Manifest.write(
        {
          version: `1.0.0`,
          timestamp: new Date().toISOString(),
          totalRoutes: routes.length,
          routes: routes.sort(), // Sort for deterministic output
        },
        config.paths.project.absolute.build.assets.root,
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
  catalog: Catalog.Versioned.Versioned,
  routes: string[],
): void {
  for (const schema of catalog.entries) {
    const version = schema.version
    routes.push(`/reference/version/${version}`)

    processSchemaDefinition(
      schema.definition,
      routes,
      `/reference/version/${version}`,
    )
  }
}

function processUnversionedCatalog(
  catalog: Catalog.Unversioned.Unversioned,
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
