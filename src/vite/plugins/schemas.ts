import { Api } from '#api/$'
import { Schema } from '#api/schema/$'
import type { Diagnostic as AugmentationDiagnostic } from '#api/schema/augmentations/diagnostics/diagnostic'
import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'
import { ViteReactive } from '#lib/vite-reactive/$'
import { createAssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { ViteVirtual } from '#lib/vite-virtual/$'
import { debugPolen } from '#singletons/debug'
import { polenVirtual } from '#vite/vi'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { FsLoc } from '@wollybeard/kit'
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
      Ef.map((result) => {
        // Store diagnostics for reporting
        if (Op.isSome(result) && Op.isSome(result.value.diagnostics)) {
          lastDiagnostics = result.value.diagnostics.value
        }
        return Op.isSome(result) ? result.value : null
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

    const fileLoc = FsLoc.decodeSync(file)
    const absoluteFile = FsLoc.Groups.Abs.is(fileLoc)
      ? fileLoc
      : FsLoc.join(FsLoc.fromString(process.cwd() + '/'), fileLoc)

    // Check if file path matches the configured schema file
    if (config.schema.sources?.file?.path) {
      const schemaFileLoc = FsLoc.decodeSync(config.schema.sources.file.path)
      const absoluteSchemaFile = FsLoc.Groups.Abs.is(schemaFileLoc)
        ? schemaFileLoc
        : FsLoc.join(config.paths.project.rootDir, schemaFileLoc)
      if (FsLoc.encodeSync(absoluteFile) === FsLoc.encodeSync(absoluteSchemaFile)) return true
    }

    // Check if file path is within the configured schema directory
    if (config.schema.sources?.directory?.path) {
      const schemaDirLoc = FsLoc.decodeSync(config.schema.sources.directory.path)
      const absoluteSchemaDir = FsLoc.Groups.Abs.is(schemaDirLoc)
        ? schemaDirLoc
        : FsLoc.join(config.paths.project.rootDir, schemaDirLoc)
      const absoluteFilePath = FsLoc.encodeSync(absoluteFile)
      const absoluteSchemaDirPath = FsLoc.encodeSync(absoluteSchemaDir)
      if (absoluteFilePath.startsWith(absoluteSchemaDirPath)) return true
    }

    // Check if file is the introspection file
    if (config.schema.sources?.introspection?.url) {
      const absoluteIntrospectionFile = FsLoc.join(
        config.paths.project.rootDir,
        FsLoc.fromString(`schema.introspection.json`),
      )
      if (FsLoc.encodeSync(absoluteFile) === FsLoc.encodeSync(absoluteIntrospectionFile)) return true
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
      paths.push(FsLoc.encodeSync(
        FsLoc.join(config.paths.project.rootDir, FsLoc.fromString(`schema.introspection.json`)),
      ))
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
          Ef.gen(function*() {
            const data = Op.getOrNull(loadedCatalog.data)
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
          if (data?.diagnostics && Op.isSome(data.diagnostics)) {
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

            const schemaResult = await Ef.runPromise(
              reader.read().pipe(Ef.provide(NodeFileSystem.layer)),
            )

            // Report diagnostics if any
            if (
              schemaResult?.diagnostics && Op.isSome(schemaResult.diagnostics)
              && schemaResult.diagnostics.value.length > 0
            ) {
              reportDiagnostics(schemaResult.diagnostics.value, 'dev')
            }

            if (!schemaResult?.data) {
              return `export const schemasCatalog = null`
            }
            return `
              import { Catalog } from 'graphql-kit'
              const encoded = ${JSON.stringify(Catalog.encodeSync(Op.getOrThrow(schemaResult.data)))}
              export const schemasCatalog = Catalog.decodeSync(encoded)
            `
          },
        },
      ),
    },
  ]

  return { plugins, reader }
}
