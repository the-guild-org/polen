import type { Config } from '#api/config/index'
import { SchemaAugmentation } from '#api/schema-augmentation/index'
import { Schema } from '#api/schema/index'
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
    const schemaData = await Schema.readOrThrow({
      ...config.schema,
      projectRoot: config.paths.project.rootDir,
    })

    if (!schemaData) {
      const metadata: Schema.SchemaMetadata = { hasSchema: false, versions: [] }
      return {
        schemaData: null,
        metadata,
      }
    }

    // Apply augmentations
    schemaData.forEach(version => {
      SchemaAugmentation.apply(version.after, config.schemaAugmentations)
    })

    // Build metadata
    const versionStrings: string[] = []
    for (const [index, version] of schemaData.entries()) {
      const versionName = index === 0 ? Schema.VERSION_LATEST : Schema.dateToVersionString(version.date)
      versionStrings.push(versionName)
    }

    const metadata = {
      hasSchema: true,
      versions: versionStrings,
    }

    debug(`schemaDataLoaded`, { versionCount: schemaData.length })

    return {
      schemaData,
      metadata,
    }
  })

  // Helper to write assets directly to filesystem in dev mode
  const writeDevAssets = async (
    schemaData: Awaited<ReturnType<typeof Schema.readOrThrow>>,
    metadata: Schema.SchemaMetadata,
  ) => {
    if (!schemaData) return

    const devAssetsDir = config.paths.framework.devAssets.schemas
    await NodeFs.mkdir(devAssetsDir, { recursive: true })

    // Write schema JSON files and changelog files
    for (const [index, version] of schemaData.entries()) {
      const schemaString = Grafaid.Schema.print(version.after)
      const ast = Grafaid.Schema.AST.parse(schemaString)
      const versionName = index === 0 ? Schema.VERSION_LATEST : Schema.dateToVersionString(version.date)

      // Write schema AST file
      const schemaFilePath = NodePath.join(devAssetsDir, `${versionName}.json`)
      await NodeFs.writeFile(schemaFilePath, JSON.stringify(ast), 'utf-8')
      debug(`devAssetWritten`, { fileName: `${versionName}.json` })

      // Write changelog file (except for the oldest/last version)
      if (index < schemaData.length - 1) {
        const changelogData = {
          changes: version.changes,
          date: version.date.toISOString(),
        }
        const changelogFilePath = NodePath.join(devAssetsDir, `${versionName}.changelog.json`)
        await NodeFs.writeFile(changelogFilePath, JSON.stringify(changelogData), 'utf-8')
        debug(`devChangelogWritten`, { fileName: `${versionName}.changelog.json` })
      }
    }

    // Write metadata file
    const metadataPath = NodePath.join(devAssetsDir, 'metadata.json')
    await NodeFs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')
    debug(`devMetadataWritten`, {})
  }

  return {
    name: `polen:schema-assets`,

    configureServer(server) {
      viteServer = server

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

      // Build mode: Use Vite's emitFile
      for (const [index, version] of schemaData.entries()) {
        // Convert GraphQL Schema to AST JSON
        const schemaString = Grafaid.Schema.print(version.after)
        const ast = Grafaid.Schema.AST.parse(schemaString)

        // Determine version name
        const versionName = index === 0 ? Schema.VERSION_LATEST : Schema.dateToVersionString(version.date)

        // Emit schema AST file
        const schemaAssetFileName =
          `${config.paths.project.relative.build.relative.assets.root}/schemas/${versionName}.json`

        this.emitFile({
          type: `asset`,
          fileName: schemaAssetFileName,
          source: JSON.stringify(ast),
        })

        debug(`schemaAssetEmitted`, { fileName: schemaAssetFileName })

        // Emit changelog file (except for the oldest/last version)
        if (index < schemaData.length - 1) {
          const changelogData = {
            changes: version.changes,
            date: version.date.toISOString(),
          }
          const changelogAssetFileName =
            `${config.paths.project.relative.build.relative.assets.root}/schemas/${versionName}.changelog.json`

          this.emitFile({
            type: `asset`,
            fileName: changelogAssetFileName,
            source: JSON.stringify(changelogData),
          })

          debug(`changelogAssetEmitted`, { fileName: changelogAssetFileName })
        }
      }

      // Emit metadata file
      this.emitFile({
        type: `asset`,
        fileName: `${config.paths.project.relative.build.relative.assets.root}/schemas/metadata.json`,
        source: JSON.stringify(metadata, null, 2),
      })
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
