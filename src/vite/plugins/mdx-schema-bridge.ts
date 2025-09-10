import type { LoadedCatalog } from '#api/schema/input-source/load'
import type { AssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { FileSystem } from '@effect/platform'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Effect } from 'effect'
import type { Plugin } from 'vite'

// Module-level storage for schema catalog during build
let currentSchemaCatalog: LoadedCatalog | null = null

export const setCurrentSchema = (schema: LoadedCatalog | null) => {
  currentSchemaCatalog = schema
}

export const getCurrentSchema = (): LoadedCatalog | null => {
  return currentSchemaCatalog
}

interface MdxSchemaBridgeOptions {
  schemaReader: AssetReader<LoadedCatalog | null, any, FileSystem.FileSystem>
}

/**
 * Vite plugin that bridges schema data to MDX compilation.
 * Loads schema early and makes it available to remark plugins.
 */
export const MdxSchemaBridge = ({ schemaReader }: MdxSchemaBridgeOptions): Plugin => {
  return {
    name: 'polen:mdx-schema-bridge',
    enforce: 'pre', // Run early in plugin chain

    async buildStart() {
      // Load schema at build start
      try {
        const result = await Effect.runPromise(
          schemaReader.read().pipe(Effect.provide(NodeFileSystem.layer)),
        )
        // The result IS the LoadedCatalog
        setCurrentSchema(result)
      } catch (error) {
        console.warn('Failed to load schema for MDX references:', error)
      }
    },

    // Update schema on hot reload
    async handleHotUpdate({ file }) {
      // Check if this is a schema file change
      if (file.includes('schema') || file.endsWith('.graphql') || file.endsWith('.gql')) {
        try {
          const result = await Effect.runPromise(
            schemaReader.read().pipe(Effect.provide(NodeFileSystem.layer)),
          )
          // The result IS the LoadedCatalog
          setCurrentSchema(result)
        } catch (error) {
          console.warn('Failed to reload schema for MDX references:', error)
        }
      }
    },
  }
}
