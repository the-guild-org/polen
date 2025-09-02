import { Api } from '#api/index'
import { Schema } from '#api/schema/$'
import { Catalog } from '#lib/catalog/$'
import { ViteReactive } from '#lib/vite-reactive/$'
import { createAssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { Effect } from 'effect'
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
 * @returns Object with Vite plugin instance and reader
 */
export const Schemas = (
  config: Api.Config.Config,
) => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Self-contained Schema Reader
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const reader = createAssetReader(() => Schema.loadOrNull(config))

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

  // Gather watch paths for schema files
  const getWatchPaths = (): string[] => {
    const paths: string[] = []

    if (config.schema?.sources?.directory?.path) {
      paths.push(config.schema.sources.directory.path)
    }
    if (config.schema?.sources?.file?.path) {
      paths.push(config.schema.sources.file.path)
    }
    if (config.schema?.sources?.introspection?.url) {
      paths.push(NodePath.join(config.paths.project.rootDir, `schema.introspection.json`))
    }

    return paths
  }

  const plugins = [
    ViteReactive.ReactiveAssetPlugin({
      name: 'schemas',
      reader,
      emit: {
        // @claude in what case can data be null?
        serializer: (loadedCatalog) =>
          Effect.gen(function*() {
            if (!loadedCatalog.data) throw new Error('No schema data to serialize')
            const encoded = yield* Catalog.encode(loadedCatalog.data)
            return JSON.stringify(encoded, null, 2)
          }),
        path: 'schemas/catalog.json',
      },
      filePatterns: {
        watch: getWatchPaths,
        isRelevant: isSchemaFile,
      },
      dependentVirtualModules: [], // Schema assets doesn't have virtual modules
    }),
  ]

  return { plugins, reader }
}
