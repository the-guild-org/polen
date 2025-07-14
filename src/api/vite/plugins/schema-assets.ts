import type { Config } from '#api/config/index'
import type { Vite } from '#dep/vite/index'
import { Grafaid } from '#lib/grafaid/index'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { debugPolen } from '#singletons/debug'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { Schema } from '../../schema/index.js'
import { dateToVersionString, type SchemaMetadata, VERSION_LATEST } from '../../schema/schema.js'
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
  let schemaData: Awaited<ReturnType<typeof Schema.readOrThrow>> | null = null
  let metadata: SchemaMetadata = { hasSchema: false, versions: [] }
  let isServeMode = false

  return {
    name: `polen:schema-assets`,

    configureServer() {
      isServeMode = true
    },

    async buildStart() {
      debug(`buildStart`, {})

      if (isServeMode) {
        // Skip expensive schema processing in dev mode
        // But still provide virtual module for import resolution
        metadata = { hasSchema: false, versions: [] }
        debug(`devMode:skippingSchemaProcessing`, {})
        return
      }

      // Read schema files (build mode only)
      schemaData = await Schema.readOrThrow({
        ...config.schema,
        projectRoot: config.paths.project.rootDir,
      })

      if (!schemaData) {
        debug(`noSchemaFound`, {})
        return
      }

      // Apply augmentations
      schemaData.versions.forEach(version => {
        SchemaAugmentation.apply(version.after, config.schemaAugmentations)
      })

      // Build metadata
      const versionStrings: string[] = []
      for (const [index, version] of schemaData.versions.entries()) {
        const versionName = index === 0 ? VERSION_LATEST : dateToVersionString(version.date)
        versionStrings.push(versionName)
      }

      metadata = {
        hasSchema: true,
        versions: versionStrings,
      }

      debug(`schemasFound`, { versionCount: schemaData.versions.length })

      // Emit JSON assets for each version (build mode only)
      for (const [index, version] of schemaData.versions.entries()) {
        // Convert GraphQL Schema to AST JSON
        const schemaString = Grafaid.Schema.print(version.after)
        const ast = Grafaid.Schema.AST.parse(schemaString)

        // Determine version name
        const versionName = index === 0 ? VERSION_LATEST : dateToVersionString(version.date)

        // Emit the asset
        const assetFileName = `${config.paths.project.relative.build.relative.assets}/schemas/${versionName}.json`
        this.emitFile({
          type: `asset`,
          fileName: assetFileName,
          source: JSON.stringify(ast),
        })

        debug(`schemaAssetEmitted`, { fileName: assetFileName })
      }

      // Emit metadata file
      this.emitFile({
        type: `asset`,
        fileName: `${config.paths.project.relative.build.relative.assets}/schemas/metadata.json`,
        source: JSON.stringify(metadata, null, 2),
      })
    },

    ...ViteVirtual.IdentifiedLoader.toHooks({
      identifier: viProjectSchemaMetadata,
      loader() {
        debug(`virtualModuleLoad`, { id: viProjectSchemaMetadata.id })
        return `export default ${JSON.stringify(metadata)}`
      },
    }),
  }
}
