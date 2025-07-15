import type { Config } from '#api/config/index'
import { SchemaAugmentation } from '#api/schema-augmentation/index'
import { createSchemaSource } from '#api/schema-source/index'
import { Schema } from '#api/schema/index'
import type { NonEmptyChangeSets } from '../../schema/schema.js'
import type { Vite } from '#dep/vite/index'
import { Grafaid } from '#lib/grafaid/index'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { debugPolen } from '#singletons/debug'
import { Cache } from '@wollybeard/kit'
import * as NodeFs from 'node:fs/promises'
import * as NodePath from 'node:path'
import { polenVirtual } from '../vi.js'

export const viProjectSchemaMetadata = polenVirtual([`project`, `schema-metadata`])

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

  // Helper to load and process schema data
  const loadAndProcessSchemaData = Cache.memoize(async () => {
    const schemaResult = await Schema.readOrThrow({
      ...config.schema,
      projectRoot: config.paths.project.rootDir,
    })

    if (!schemaResult.data) {
      const metadata: Schema.SchemaMetadata = { hasSchema: false, versions: [] }
      return {
        schemaData: null,
        metadata,
        source: schemaResult.source,
      }
    }

    // Apply augmentations
    schemaResult.data.forEach(version => {
      SchemaAugmentation.apply(version.after, config.schemaAugmentations)
    })

    // Build metadata
    const versionStrings: string[] = []
    for (const [index, version] of schemaResult.data.entries()) {
      const versionName = index === 0 ? Schema.VERSION_LATEST : Schema.dateToVersionString(version.date)
      versionStrings.push(versionName)
    }

    const metadata = {
      hasSchema: true,
      versions: versionStrings,
    }

    debug(`schemaDataLoaded`, { versionCount: schemaResult.data.length })

    return {
      schemaData: schemaResult.data,
      metadata,
      source: schemaResult.source,
    }
  })

  // Helper to create schema source with filesystem IO
  const createDevSchemaSource = (metadata: Schema.SchemaMetadata) => {
    return createSchemaSource({
      io: {
        read: async () => {
          throw new Error('Read not supported in dev asset writer')
        },
        write: async (path: string, content: string) => {
          await NodeFs.writeFile(path, content, 'utf-8')
        },
        clearDirectory: async (path: string) => {
          try {
            const files = await NodeFs.readdir(path)
            await Promise.all(files.map(file => NodeFs.rm(NodePath.join(path, file), { force: true })))
          } catch (error) {
            // Directory might not exist, which is fine
          }
        },
        removeFile: async (path: string) => {
          await NodeFs.rm(path, { force: true })
        },
      },
      versions: metadata.versions,
      assetsPath: config.paths.framework.devAssets.absolute,
    })
  }

  // Helper to write assets using schema-source API
  const writeDevAssets = async (
    schemaData: NonEmptyChangeSets,
    metadata: Schema.SchemaMetadata,
  ) => {
    // schemaData is now guaranteed to be non-null NonEmptyChangeSets

    const devAssetsDir = config.paths.framework.devAssets.schemas
    await NodeFs.mkdir(devAssetsDir, { recursive: true })

    const schemaSource = createDevSchemaSource(metadata)
    await schemaSource.writeAllAssets(schemaData, metadata)
    debug(`devAssetsWritten`, { versionCount: schemaData.length })
  }

  return {
    name: `polen:schema-assets`,

    configureServer(server) {
      viteServer = server

      // Clear all assets when dev server starts
      const clearAssets = async () => {
        try {
          // Create a basic schema source just for clearing
          const schemaSource = createDevSchemaSource({ hasSchema: false, versions: [] })
          await schemaSource.clearAllAssets()
          debug(`devAssetsCleared`, {})
        } catch (error) {
          // Ignore errors during clearing
        }
      }

      // Clear assets immediately
      void clearAssets()

      // Set up file watching for schema source files
      if (config.schema?.dataSources?.directory?.path) {
        // Watch the entire directory for directory mode
        server.watcher.add(config.schema.dataSources.directory.path)
        debug(`watchingSchemaDirectory`, { path: config.schema.dataSources.directory.path })
      }

      if (config.schema?.dataSources?.file?.path) {
        // Watch the specific file for file mode
        server.watcher.add(config.schema.dataSources.file.path)
        debug(`watchingSchemaFile`, { path: config.schema.dataSources.file.path })
      }

      if (config.schema?.dataSources?.introspection?.url) {
        // Watch the introspection file if introspection is configured
        const introspectionFilePath = NodePath.join(config.paths.project.rootDir, `schema.introspection.json`)
        server.watcher.add(introspectionFilePath)
        debug(`watchingIntrospectionFile`, { path: introspectionFilePath })
      }

      // Handle file removal
      server.watcher.on('unlink', async (file) => {
        const isSchemaFile = config.schema && (() => {
          const absoluteFile = NodePath.resolve(file)

          // Check if file path matches the configured schema file
          if (config.schema.dataSources?.file?.path) {
            const absoluteSchemaFile = NodePath.resolve(
              config.paths.project.rootDir,
              config.schema.dataSources.file.path,
            )
            if (absoluteFile === absoluteSchemaFile) return true
          }

          // Check if file path is within the configured schema directory
          if (config.schema.dataSources?.directory?.path) {
            const absoluteSchemaDir = NodePath.resolve(
              config.paths.project.rootDir,
              config.schema.dataSources.directory.path,
            )
            if (absoluteFile.startsWith(absoluteSchemaDir + NodePath.sep)) return true
          }

          // Check if file is the introspection file
          if (config.schema.dataSources?.introspection?.url) {
            const absoluteIntrospectionFile = NodePath.resolve(
              config.paths.project.rootDir,
              `schema.introspection.json`,
            )
            if (absoluteFile === absoluteIntrospectionFile) return true
          }

          return false
        })()

        if (isSchemaFile) {
          debug(`schemaFileRemoved`, { file })

          try {
            // Clear cache and regenerate
            loadAndProcessSchemaData.clear()
            const { schemaData, metadata, source } = await loadAndProcessSchemaData()

            // If file was deleted but can be recreated, attempt recreation
            if (!schemaData && source.reCreate) {
              debug(`attemptingSchemaRecreation`, { sourceType: source.type })
              try {
                const recreatedData = await source.reCreate()
                if (recreatedData) {
                  // Clear cache again and reload after recreation
                  loadAndProcessSchemaData.clear()
                  const reloadResult = await loadAndProcessSchemaData()
                  if (reloadResult.schemaData) {
                    await writeDevAssets(reloadResult.schemaData, reloadResult.metadata)
                    debug(`hmr:schemaRecreatedAndWritten`, { versionCount: reloadResult.schemaData.length })
                  }
                } else {
                  debug(`hmr:schemaRecreationFailed`, { reason: 'reCreate returned null' })
                }
              } catch (recreationError) {
                debug(`hmr:schemaRecreationFailed`, { error: recreationError })
              }
            } else if (schemaData) {
              // Write new assets without the removed file
              await writeDevAssets(schemaData, metadata)
              debug(`hmr:schemaAssetsUpdatedAfterRemoval`, { versionCount: schemaData.length })
            } else {
              // No schema data and cannot recreate - clear all assets
              const schemaSource = createDevSchemaSource({ hasSchema: false, versions: [] })
              await schemaSource.clearAllAssets()
              debug(`hmr:allAssetsCleared`, {})
            }
          } catch (error) {
            debug(`hmr:schemaRemovalFailed`, { error })
          }

          // Send HMR invalidation signal
          server.ws.send({
            type: 'custom',
            event: 'polen:schema-invalidate',
            data: { timestamp: Date.now() },
          })

          debug(`hmr:schemaInvalidationSent`, {})
        }
      })
    },

    async buildStart() {
      debug(`buildStart`, {})

      // Load and process schema data
      const { schemaData, metadata } = await loadAndProcessSchemaData()

      if (!schemaData) {
        debug(`noSchemaFound`, {})
        return
      }

      // Handle asset generation differently for dev vs build
      if (viteServer) {
        // Dev mode: Write assets directly to filesystem
        await writeDevAssets(schemaData, metadata)
        debug(`devMode:schemaAssetsWritten`, {})
        return
      }

      // Build mode: Create schema source for emitting files
      const schemaSource = createSchemaSource({
        io: {
          read: async () => {
            throw new Error('Read not supported in build asset emitter')
          },
          write: async (path: string, content: string) => {
            // Convert absolute path to relative filename for Vite
            const relativePath = NodePath.relative(config.paths.framework.devAssets.absolute, path)
            const fileName = `${config.paths.project.relative.build.relative.assets.root}/${relativePath}`

            this.emitFile({
              type: `asset`,
              fileName,
              source: content,
            })
          },
        },
        versions: metadata.versions,
        assetsPath: config.paths.framework.devAssets.absolute,
      })

      // Emit all assets using the high-level API
      await schemaSource.writeAllAssets(schemaData, metadata)
      debug(`buildMode:allAssetsEmitted`, { versionCount: schemaData.length })
    },

    async handleHotUpdate({ file, server }) {
      const isSchemaFile = config.schema && (() => {
        const absoluteFile = NodePath.resolve(file)

        // Check if file path matches the configured schema file
        if (config.schema.dataSources?.file?.path) {
          const absoluteSchemaFile = NodePath.resolve(config.paths.project.rootDir, config.schema.dataSources.file.path)
          if (absoluteFile === absoluteSchemaFile) return true
        }

        // Check if file path is within the configured schema directory
        if (config.schema.dataSources?.directory?.path) {
          const absoluteSchemaDir = NodePath.resolve(
            config.paths.project.rootDir,
            config.schema.dataSources.directory.path,
          )
          if (absoluteFile.startsWith(absoluteSchemaDir + NodePath.sep)) return true
        }

        // Check if file is the introspection file
        if (config.schema.dataSources?.introspection?.url) {
          const absoluteIntrospectionFile = NodePath.resolve(
            config.paths.project.rootDir,
            `schema.introspection.json`,
          )
          if (absoluteFile === absoluteIntrospectionFile) return true
        }

        return false
      })()
      if (isSchemaFile) {
        debug(`schemaFileChanged`, { file })

        // Regenerate schema assets
        try {
          loadAndProcessSchemaData.clear()
          const { schemaData, metadata } = await loadAndProcessSchemaData()

          if (schemaData) {
            debug(`hmr:schemaRegenerated`, { versionCount: schemaData.length })

            // Write new assets to filesystem
            await writeDevAssets(schemaData, metadata)
          }
        } catch (error) {
          debug(`hmr:schemaRegenerationFailed`, { error })
        }

        // Send HMR invalidation signal
        server.ws.send({
          type: 'custom',
          event: 'polen:schema-invalidate',
          data: { timestamp: Date.now() },
        })

        debug(`hmr:schemaInvalidationSent`, {})
      }
    },

    ...ViteVirtual.IdentifiedLoader.toHooks({
      identifier: viProjectSchemaMetadata,
      async loader() {
        debug(`virtualModuleLoad`, { id: viProjectSchemaMetadata.id })
        const { metadata } = await loadAndProcessSchemaData()
        return `export default ${JSON.stringify(metadata)}`
      },
    }),
  }
}
