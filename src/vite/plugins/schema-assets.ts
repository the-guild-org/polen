import type { Config } from '#api/config/index'
import { Api } from '#api/index'
import type { Vite } from '#dep/vite/index'
import { Catalog } from '#lib/catalog/$'
import { Hydra } from '#lib/hydra/$'
import { debugPolen } from '#singletons/debug'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Cache } from '@wollybeard/kit'
import { Effect } from 'effect'
import * as NodeFs from 'node:fs/promises'
import * as NodePath from 'node:path'

/**
 * Vite plugin that generates JSON assets for GraphQL schemas at build time.
 *
 * This plugin:
 * - Reads GraphQL schema files from the project
 * - Applies schema augmentations
 * - Converts schemas to AST format and emits as JSON assets
 * - Creates a metadata file with available versions
 * - Provides a virtual module for accessing schema metadata
 *
 * The generated assets enable client-side loading of different schema versions
 * without requiring all schemas to be bundled into the main JavaScript bundle.
 *
 * @param config - Polen configuration object
 * @returns Vite plugin instance
 */
export const SchemaAssets = (config: Config.Config): Vite.Plugin => {
  const debug = debugPolen.sub(`vite-plugin:schema-assets`)
  let viteServer: Vite.ViteDevServer | null = null

  const schemaLoad = Cache.memoize(async () => {
    return await Effect.runPromise(
      Api.Schema.loadOrNull(config).pipe(
        Effect.provide(NodeFileSystem.layer),
      ),
    )
  })

  // Helper to check if a file is a schema file that should trigger regeneration
  const isSchemaFile = (file: string): boolean => {
    if (!config.schema) return false

    const absoluteFile = NodePath.resolve(file)

    // Check if file path matches the configured schema file
    if (config.schema.sources?.file?.path) {
      const absoluteSchemaFile = NodePath.resolve(
        config.paths.project.rootDir,
        config.schema.sources.file.path,
      )
      if (absoluteFile === absoluteSchemaFile) return true
    }

    // Check if file path is within the configured schema directory
    if (config.schema.sources?.directory?.path) {
      const absoluteSchemaDir = NodePath.resolve(
        config.paths.project.rootDir,
        config.schema.sources.directory.path,
      )
      if (absoluteFile.startsWith(absoluteSchemaDir + NodePath.sep)) return true
    }

    // Check if file is the introspection file
    if (config.schema.sources?.introspection?.url) {
      const absoluteIntrospectionFile = NodePath.resolve(
        config.paths.project.rootDir,
        `schema.introspection.json`,
      )
      if (absoluteFile === absoluteIntrospectionFile) return true
    }

    return false
  }

  // Helper to send HMR invalidation signal for schema changes
  const sendSchemaInvalidation = (server: Vite.ViteDevServer) => {
    server.ws.send({
      type: 'custom',
      event: 'polen:schema-invalidate',
      data: { timestamp: Date.now() },
    })
    debug(`hmr:schemaInvalidationSent`, {})
  }

  // Helper to write assets
  const writeDevAssets = async (
    loadedCatalog: Api.Schema.InputSource.LoadedCatalog,
  ) => {
    const { data: catalog } = loadedCatalog
    if (!catalog) throw new Error('No catalog data to write')

    // Create Bridge with dev assets directory as base path
    const catalogBridge = Catalog.Bridge({
      dir: config.paths.framework.devAssets.schemas,
    })

    // Clear any existing assets and export to filesystem
    // Note: We need to run these Effects
    await Effect.runPromise(
      Effect.provide(
        Effect.gen(function*() {
          yield* catalogBridge.clear()

          // Import catalog and export to filesystem
          catalogBridge.addRootValue(catalog)
          yield* catalogBridge.export()
        }),
        Hydra.Io.File(config.paths.framework.devAssets.schemas),
      ),
    )

    debug(`devAssetsWritten`)
  }

  return {
    name: `polen:schema-assets`,

    configureServer(server) {
      viteServer = server

      // Clear all assets when dev server starts
      const clearAssets = async () => {
        try {
          // Clear all assets
          const devAssetsDir = config.paths.framework.devAssets.schemas
          await NodeFs.rm(devAssetsDir, { recursive: true, force: true })
          debug(`devAssetsCleared`, {})
        } catch (error) {
          // Ignore errors during clearing
          debug(`devAssetsClearError`, { error })
        }
      }

      // Clear assets immediately
      void clearAssets()

      // Set up file watching for schema source files
      // TODO: Even when schema is disabled, we should still watch for schema file patterns
      // during development. If a user enables schema in config during dev, we need to be
      // ready to detect and load schema files immediately. Currently we skip file watching
      // entirely when schema is disabled, which means manual dev server restart is required.
      if (config.schema?.sources?.directory?.path) {
        // Watch the entire directory for directory mode
        server.watcher.add(config.schema.sources.directory.path)
        debug(`watchingSchemaDirectory`, { path: config.schema.sources.directory.path })
      }

      if (config.schema?.sources?.file?.path) {
        // Watch the specific file for file mode
        server.watcher.add(config.schema.sources.file.path)
        debug(`watchingSchemaFile`, { path: config.schema.sources.file.path })
      }

      if (config.schema?.sources?.introspection?.url) {
        // Watch the introspection file if introspection is configured
        const introspectionFilePath = NodePath.join(config.paths.project.rootDir, `schema.introspection.json`)
        server.watcher.add(introspectionFilePath)
        debug(`watchingIntrospectionFile`, { path: introspectionFilePath })
      }

      // Handle file removal
      server.watcher.on('unlink', async (file) => {
        const schemaFileDetected = isSchemaFile(file)

        if (schemaFileDetected) {
          debug(`schemaFileRemoved`, { file })

          try {
            // Clear cache and regenerate
            schemaLoad.clear()
            const loadedSchema = await schemaLoad()
            if (!loadedSchema) return

            // const { data: schemaData, manifest, source } = loadedSchema

            // If file was deleted but can be recreated, attempt recreation
            if (!loadedSchema.data && loadedSchema.source.reCreate) {
              debug(`attemptingSchemaRecreation`, { sourceType: loadedSchema.source.name })
              try {
                const recreatedData = await loadedSchema.source.reCreate({} as any, { paths: config.paths })
                if (recreatedData) {
                  // Clear cache again and reload after recreation
                  schemaLoad.clear()
                  const reloadResult = await schemaLoad()
                  if (reloadResult?.data) {
                    await writeDevAssets(reloadResult)
                    debug(`hmr:schemaRecreatedAndWritten`)
                  }
                } else {
                  debug(`hmr:schemaRecreationFailed`, { reason: 'reCreate returned null' })
                }
              } catch (recreationError) {
                debug(`hmr:schemaRecreationFailed`, { error: recreationError })
              }
            } else if (loadedSchema.data) {
              // Write new assets without the removed file
              await writeDevAssets(loadedSchema)
              debug(`hmr:schemaAssetsUpdatedAfterRemoval`)
            } else {
              // No schema data and cannot recreate - clear all assets
              const devAssetsDir = config.paths.framework.devAssets.schemas
              await NodeFs.rm(devAssetsDir, { recursive: true, force: true })
              debug(`hmr:allAssetsCleared`, {})
            }
          } catch (error) {
            debug(`hmr:schemaRemovalFailed`, { error })
          }

          // Send HMR invalidation signal
          sendSchemaInvalidation(server)
        }
      })
    },

    async buildStart() {
      debug(`buildStart`, {})

      // Load and process schema data
      const loadedSchema = await schemaLoad()
      if (!loadedSchema) {
        debug(`schemaDisabled`, {})
        return
      }
      const { data: schemaData } = loadedSchema

      if (!schemaData) {
        debug(`noSchemaFound`, {})
        return
      }

      // Handle asset generation differently for dev vs build
      if (viteServer) {
        // Dev mode: Write assets directly to filesystem
        await writeDevAssets(loadedSchema)
        debug(`devMode:schemaAssetsWritten`, {})
        return
      }

      // Build mode: Use Bridge to dehydrate and emit individual assets

      // Create Bridge instance (no dir needed for memory operations)
      // @claude the passed options {} should be optional paramter. the following should work:
      // const catalogBridge = Catalog.Bridge()
      const catalogBridge = Catalog.Bridge({})

      // Import catalog into Bridge
      catalogBridge.addRootValue(schemaData)

      // Export dehydrated assets from Bridge
      const exportedFragments = catalogBridge.exportToMemory()

      // Emit each asset file
      for (const { filename, content } of exportedFragments) {
        this.emitFile({
          type: `asset`,
          fileName: `${config.paths.project.relative.build.relative.assets.root}/schemas/${filename}`,
          source: content, // Already stringified with proper indentation
        })
      }

      debug(`buildMode:hydratableAssetsEmitted`, {
        assetCount: exportedFragments.length,
      })
    },

    async handleHotUpdate({ file, server }) {
      const schemaFileDetected = isSchemaFile(file)
      if (schemaFileDetected) {
        debug(`schemaFileChanged`, { file })

        // Regenerate schema assets
        try {
          schemaLoad.clear()
          const schema = await schemaLoad()

          if (schema?.data) {
            debug(`hmr:schemaRegenerated`)

            // Write new assets to filesystem
            await writeDevAssets(schema)
          }
        } catch (error) {
          debug(`hmr:schemaRegenerationFailed`, { error })
        }

        // Send HMR invalidation signal
        sendSchemaInvalidation(server)
      }
    },
  }
}
