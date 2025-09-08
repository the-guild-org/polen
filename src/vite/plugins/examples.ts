import type { Api } from '#api/$'
import { Examples as ExamplesModule } from '#api/examples/$'
import * as Catalog from '#api/examples/schemas/catalog'
import { generateExampleTypes } from '#api/examples/type-generator'
import { createTypeUsageIndex } from '#api/examples/type-usage-indexer'
import { Diagnostic } from '#lib/diagnostic/$'
import { ViteReactive } from '#lib/vite-reactive/$'
import { type AssetReader, createAssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Str } from '@wollybeard/kit'
import { Effect } from 'effect'
import * as Path from 'node:path'
import type * as Vite from 'vite'
import { polenVirtual } from '../vi.js'

// Virtual modules provided by this plugin
export const viProjectExamples = polenVirtual([`project`, `examples`])

export interface Options {
  config: Api.Config.Config
  // todo: get type ref via import from SOT
  schemaReader: AssetReader<Api.Schema.InputSource.LoadedCatalog | null, any, any>
  dependentVirtualModules?: ViteVirtual.Identifier.Identifier[]
}

export interface ProjectExamplesCatalog {
  examples: ExamplesModule.Example.Example[]
}

/**
 * Examples plugin with versioning support
 */
export const Examples = ({
  config,
  schemaReader,
  dependentVirtualModules = [],
}: Options): {
  plugins: Vite.Plugin[]
  reader: AssetReader<ExamplesModule.ScanResult, Error, FileSystem.FileSystem>
} => {
  const debug = debugPolen.sub(`vite-examples`)
  const examplesDir = Path.join(config.paths.project.rootDir, 'examples')

  // Track last generated example names to detect changes
  let lastGeneratedExampleNames: string[] | null = null

  const reader = createAssetReader<ExamplesModule.ScanResult, Error, FileSystem.FileSystem>(() => {
    return Effect.gen(function*() {
      const loadedCatalog = yield* schemaReader.read()

      const scanExamplesResult = yield* ExamplesModule.scan({
        dir: examplesDir,
        schemaCatalog: loadedCatalog?.data as any ?? undefined,
      })

      // Generate TypeScript types if examples have changed
      const currentExampleNames = scanExamplesResult.catalog.examples.map(e => e.name).sort()
      const exampleNamesChanged = lastGeneratedExampleNames === null
        || currentExampleNames.length !== lastGeneratedExampleNames.length
        || currentExampleNames.some((id, i) => id !== lastGeneratedExampleNames![i])

      if (exampleNamesChanged) {
        debug(`Examples changed, regenerating types`)
        yield* generateExampleTypes(scanExamplesResult.catalog, config.paths.project.rootDir)
        lastGeneratedExampleNames = currentExampleNames
      }

      debug('Found examples', { count: scanExamplesResult.catalog.examples.length })
      return scanExamplesResult
    })
  })

  const scanExamples = async () => {
    return await Effect.runPromise(
      reader.read().pipe(Effect.provide(NodeFileSystem.layer)),
    )
  }

  // Map diagnostic to its control configuration
  const getControlForDiagnostic = (diagnostic: ExamplesModule.Diagnostic) => {
    if (diagnostic.source === 'examples-scanner') {
      switch (diagnostic.name) {
        case 'duplicate-content':
          return config.examples.diagnostics?.duplicateContent
        case 'missing-versions':
          return config.examples.diagnostics?.missingVersions
        case 'unknown-version':
          // Always show errors for unknown versions (they are discarded from catalog)
          return {
            enabled: true,
            dev: { severity: 'error' as const },
            build: { severity: 'error' as const },
          }
      }
    } else if (diagnostic.source === 'examples-validation') {
      return config.examples.diagnostics?.validation
    }
    return undefined
  }

  // Apply DiagnosticControl filtering and report diagnostics
  const reportDiagnostics = (
    diagnostics: ExamplesModule.Diagnostic[],
    phase: 'dev' | 'build' = 'dev',
  ) => {
    Diagnostic.filterAndReport(diagnostics, getControlForDiagnostic, phase)
  }

  const plugins = [
    ViteReactive.ReactiveAssetPlugin({
      name: 'examples',
      reader,
      filePatterns: {
        watch: [examplesDir],
        isRelevant: (file) => {
          return file.includes(examplesDir) && (
            file.endsWith('.graphql')
            || file.endsWith('.gql')
            || file.endsWith('index.md')
            || file.endsWith('index.mdx')
          )
        },
      },
      dependentVirtualModules: [viProjectExamples, ...dependentVirtualModules],
      hooks: {
        async shouldFullReload() {
          // Always trigger full reload for examples changes
          return true
        },
        async onDiagnostics(data) {
          // Report diagnostics with DiagnosticControl filtering
          reportDiagnostics(data.diagnostics, 'dev')
        },
      },
    }),
    {
      name: 'polen:examples-virtual',
      ...ViteVirtual.IdentifiedLoader.toHooks(
        {
          identifier: viProjectExamples,
          async loader() {
            debug(`Loading viProjectExamples virtual module`)

            const scanExamplesResult = await scanExamples()

            reportDiagnostics(scanExamplesResult.diagnostics, 'dev')

            // Generate type usage index if schemas are available
            let catalogWithIndex = scanExamplesResult.catalog
            const schemaReaderResult = await Effect.runPromise(
              schemaReader.read().pipe(Effect.provide(NodeFileSystem.layer)) as any,
            )
            const schemasCatalog = (schemaReaderResult as any)?.data
            if (schemasCatalog) {
              const typeUsageIndex = createTypeUsageIndex(
                scanExamplesResult.catalog.examples,
                schemasCatalog,
              )
              catalogWithIndex = {
                ...scanExamplesResult.catalog,
                typeUsageIndex: typeUsageIndex,
              }
            }

            // Generate the module code with both catalog and component exports
            const s = Str.Builder()
            s`import { Effect } from 'effect'`
            s`import * as Catalog from '#api/examples/schemas/catalog'`

            const indexFilePath = scanExamplesResult.catalog.index?.path
            if (indexFilePath) {
              s``
              s`export { default as IndexComponent } from '${indexFilePath}'`
            } else {
              s``
              s`export const IndexComponent = null`
            }

            // Encode the catalog to ensure HashMap and other Effect types are properly serialized
            const encodedCatalog = Catalog.encodeSync(catalogWithIndex)

            s``
            s`const catalogData = ${JSON.stringify(encodedCatalog)}`
            s``
            s`export const examplesCatalog = Effect.runSync(Catalog.decode(catalogData))`

            return s.render()
          },
        },
      ),
    },
  ]

  return { plugins, reader }
}
