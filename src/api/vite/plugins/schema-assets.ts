import type { Config } from '#api/config/index'
import type { Vite } from '#dep/vite/index'
import { Grafaid } from '#lib/grafaid/index'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { debugPolen } from '#singletons/debug'
import { dateToVersionString, VERSION_LATEST } from '#template/lib/schema-utils/constants'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { Schema } from '../../schema/index.js'
import { polenVirtual } from '../vi.js'

export const viProjectSchemaMetadata = polenVirtual([`project`, `schema-metadata`])

/**
 * Schema metadata information
 */
interface SchemaMetadata {
  /** Whether a schema is present in the project */
  hasSchema: boolean
  /** Array of available version identifiers */
  versions: string[]
}

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

  return {
    name: `polen:schema-assets`,

    async buildStart() {
      debug(`buildStart`, {})

      // Read schema files
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

      // Emit JSON assets for each version
      for (const [index, version] of schemaData.versions.entries()) {
        // Convert GraphQL Schema to AST JSON
        const schemaString = Grafaid.Schema.print(version.after)
        const ast = Grafaid.Schema.AST.parse(schemaString)

        // Determine version name
        const versionName = index === 0 ? VERSION_LATEST : dateToVersionString(version.date)

        // Emit the asset
        const assetFileName = `${config.paths.project.relative.build.relative.assets}/schema-${versionName}.json`
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
        fileName: `${config.paths.project.relative.build.relative.assets}/schema-metadata.json`,
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
