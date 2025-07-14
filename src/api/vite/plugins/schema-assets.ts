import type { Config } from '#api/config/index'
import type { Vite } from '#dep/vite/index'
import { Grafaid } from '#lib/grafaid/index'
import { dateToVersionString, VERSION_LATEST } from '#lib/schema-utils/constants'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { debugPolen } from '#singletons/debug'
import { Schema } from '../../schema/index.js'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { polenVirtual } from '../vi.js'

export const viProjectSchemaMetadata = polenVirtual([`project`, `schema-metadata`])

interface SchemaMetadata {
  hasSchema: boolean
  versions: string[]
}

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
        this.emitFile({
          type: `asset`,
          fileName: `assets/schema-${versionName}.json`,
          source: JSON.stringify(ast),
        })
        
        debug(`schemaAssetEmitted`, { fileName: `schema-${versionName}.json` })
      }
      
      // Emit metadata file
      this.emitFile({
        type: `asset`,
        fileName: `assets/schema-metadata.json`,
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