import { Examples as ExamplesModule } from '#api/examples/$'
import { generateExampleTypes } from '#api/examples/type-generator'
import type { Api } from '#api/index'
import { Diagnostic } from '#lib/diagnostic/$'
import { ViteReactive } from '#lib/vite-reactive/$'
import { type AssetReader, createAssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Effect } from 'effect'
import * as Path from 'node:path'
import { polenVirtual } from '../vi.js'

const debug = debugPolen.sub(`vite-examples`)

// Virtual modules provided by this plugin
export const viProjectExamples = polenVirtual([`project`, `examples`])

export interface Options {
  config: Api.Config.Config
  // todo: get type ref via import from SOT
  schemaReader: AssetReader<Api.Schema.InputSource.LoadedCatalog | null, any, any>
}

export interface ProjectExamplesCatalog {
  examples: ExamplesModule.Example[]
}

/**
 * Examples plugin with versioning support
 */
export const Examples = ({
  config,
  schemaReader,
}: Options) => {
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
        case 'unused-default':
          return config.examples.diagnostics?.unusedVersions
        case 'duplicate-content':
          return config.examples.diagnostics?.duplicateContent
        case 'missing-versions':
          return config.examples.diagnostics?.missingVersions
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
          return file.includes(examplesDir) && (file.endsWith('.graphql') || file.endsWith('.gql'))
        },
      },
      dependentVirtualModules: [viProjectExamples],
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

            // Report diagnostics with DiagnosticControl filtering
            reportDiagnostics(scanExamplesResult.diagnostics, 'dev')

            // Catalog is now returned directly from scan
            return `export const examplesCatalog = ${JSON.stringify(scanExamplesResult.catalog)}`
          },
        },
      ),
    },
  ]

  return { plugins, reader }
}
