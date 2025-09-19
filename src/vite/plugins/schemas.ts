import { Api } from '#api/$'
import { Schema } from '#api/schema/$'
import type { Diagnostic as AugmentationDiagnostic } from '#api/schema/augmentations/diagnostics/diagnostic'
import { O } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'
import { ViteReactive } from '#lib/vite-reactive/$'
import { createAssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { ViteVirtual } from '#lib/vite-virtual/$'
import { debugPolen } from '#singletons/debug'
import { polenVirtual } from '#vite/vi'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import { Catalog } from 'graphql-kit'

export const viProjectSchema = polenVirtual([`project`, `schemas`])

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
export const Schemas = ({
  config,
  dependentVirtualModules = [],
}: {
  config: Api.Config.Config
  dependentVirtualModules: ViteVirtual.Identifier.Identifier[]
}) => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Self-contained Schema Reader
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  let lastDiagnostics: AugmentationDiagnostic[] = []

  const reader = createAssetReader(() =>
    Schema.loadOrNull(config).pipe(
      Effect.map((result) => {
        // Store diagnostics for reporting
        if (O.isSome(result) && O.isSome(result.value.diagnostics)) {
          lastDiagnostics = result.value.diagnostics.value
        }
        return O.isSome(result) ? result.value : null
      }),
    )
  )

  // Map diagnostic to its control configuration
  const getControlForDiagnostic = (diagnostic: AugmentationDiagnostic) => {
    if (diagnostic.source === 'schema-augmentations') {
      // All augmentation errors are always enabled with error severity
      return {
        enabled: true,
        dev: { severity: 'error' as const },
        build: { severity: 'error' as const },
      }
    }
    return undefined
  }

  // Report diagnostics
  const reportDiagnostics = (
    diagnostics: AugmentationDiagnostic[],
    phase: 'dev' | 'build' = 'dev',
  ) => {
    Diagnostic.filterAndReport(diagnostics, getControlForDiagnostic, phase)
  }

  // Helper to check if a file is a schema file that should trigger regeneration
  const isSchemaFile = (file: string): boolean => {
    if (!config.schema) return false

    const absoluteFile = Path.resolve(file)

    // Check if file path matches the configured schema file
    if (config.schema.sources?.file?.path) {
      const absoluteSchemaFile = Path.resolve(
        config.paths.project.rootDir,
        config.schema.sources.file.path,
      )
      if (absoluteFile === absoluteSchemaFile) return true
    }

    // Check if file path is within the configured schema directory
    if (config.schema.sources?.directory?.path) {
      const absoluteSchemaDir = Path.resolve(
        config.paths.project.rootDir,
        config.schema.sources.directory.path,
      )
      if (absoluteFile.startsWith(absoluteSchemaDir + Path.sep)) return true
    }

    // Check if file is the introspection file
    if (config.schema.sources?.introspection?.url) {
      const absoluteIntrospectionFile = Path.resolve(
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
      paths.push(Path.join(config.paths.project.rootDir, `schema.introspection.json`))
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
            const data = O.getOrNull(loadedCatalog.data)
            if (!data) throw new Error('No schema data to serialize')
            const encoded = yield* Catalog.encode(data)
            return JSON.stringify(encoded, null, 2)
          }),
        path: 'schemas/catalog.json',
      },
      filePatterns: {
        watch: getWatchPaths,
        isRelevant: isSchemaFile,
      },
      dependentVirtualModules,
      hooks: {
        async onDiagnostics(data) {
          // Report augmentation diagnostics
          if (data?.diagnostics && O.isSome(data.diagnostics)) {
            reportDiagnostics(data.diagnostics.value as AugmentationDiagnostic[], 'dev')
          }
        },
      },
    }),
    {
      name: 'polen:schemas-virtual',
      ...ViteVirtual.IdentifiedLoader.toHooks(
        {
          identifier: viProjectSchema,
          async loader() {
            const debug = debugPolen.sub(`module-project-schema`)
            debug(`load`, { id: viProjectSchema.id })

            const schemaResult = await Effect.runPromise(
              reader.read().pipe(Effect.provide(NodeFileSystem.layer)),
            )

            // Report diagnostics if any
            if (
              schemaResult?.diagnostics && O.isSome(schemaResult.diagnostics)
              && schemaResult.diagnostics.value.length > 0
            ) {
              reportDiagnostics(schemaResult.diagnostics.value, 'dev')
            }

            if (!schemaResult?.data) {
              return `export const schemasCatalog = null`
            }
            return `
              import { Catalog } from 'graphql-kit'
              const encoded = ${JSON.stringify(Catalog.encodeSync(O.getOrThrow(schemaResult.data)))}
              export const schemasCatalog = Catalog.decodeSync(encoded)
            `
          },
        },
      ),
    },
  ]

  return { plugins, reader }
}
