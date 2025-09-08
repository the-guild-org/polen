import type { Api } from '#api/$'
import * as ReferenceModule from '#api/reference/$'
import * as Catalog from '#api/reference/catalog'
import { Diagnostic } from '#lib/diagnostic/$'
import { ViteReactive } from '#lib/vite-reactive/$'
import { type AssetReader, createAssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Str } from '@wollybeard/kit'
import { Effect } from 'effect'
import type * as Vite from 'vite'
import { polenVirtual } from '../vi.js'

// Virtual modules provided by this plugin
export const viProjectReference = polenVirtual([`project`, `reference`])

export interface Options {
  config: Api.Config.Config
  dependentVirtualModules?: ViteVirtual.Identifier.Identifier[]
}

/**
 * Reference plugin for handling reference documentation
 */
export const Reference = ({
  config,
  dependentVirtualModules = [],
}: Options): {
  plugins: Vite.Plugin[]
  reader: AssetReader<ReferenceModule.ScanResult, Error, FileSystem.FileSystem>
} => {
  const debug = debugPolen.sub(`vite-reference`)

  const reader = createAssetReader<ReferenceModule.ScanResult, Error, FileSystem.FileSystem>(() => {
    return ReferenceModule.scan({
      dir: config.paths.project.rootDir,
    })
  })

  const scanReference = async () => {
    return await Effect.runPromise(
      reader.read().pipe(Effect.provide(NodeFileSystem.layer)),
    )
  }

  // Map diagnostic to its control configuration
  const getControlForDiagnostic = (diagnostic: any) => {
    return config.reference.diagnostics?.validation
  }

  // Report diagnostics
  const reportDiagnostics = (
    diagnostics: any[],
    phase: 'dev' | 'build' = 'dev',
  ) => {
    Diagnostic.filterAndReport(diagnostics, getControlForDiagnostic, phase)
  }

  // Check if a file is the reference index file
  const isReferenceIndexFile = (file: string): boolean => {
    return file.endsWith('/reference/index.md') || file.endsWith('/reference/index.mdx')
  }

  const plugins: Vite.Plugin[] = [
    ViteReactive.ReactiveAssetPlugin<ReferenceModule.ScanResult, Error, FileSystem.FileSystem>({
      name: 'polen:reference-reactive',
      reader,
      filePatterns: {
        watch: ['reference'],
        isRelevant: (file: string) => {
          return isReferenceIndexFile(file)
        },
      },
      dependentVirtualModules: [viProjectReference, ...dependentVirtualModules],
      hooks: {
        async shouldFullReload() {
          // Trigger full reload for reference changes
          return true
        },
        async onDiagnostics(data: any) {
          // Report diagnostics with DiagnosticControl filtering
          reportDiagnostics(data.diagnostics, 'dev')
        },
      },
    }),
    {
      name: 'polen:reference-virtual',
      ...ViteVirtual.IdentifiedLoader.toHooks(
        {
          identifier: viProjectReference,
          async loader() {
            debug(`Loading viProjectReference virtual module`)

            const scanReferenceResult = await scanReference()

            reportDiagnostics(scanReferenceResult.diagnostics, 'dev')

            // Generate the module code with both catalog and component exports
            const s = Str.Builder()
            s`import { Effect } from 'effect'`
            s`import * as Catalog from '#api/reference/catalog'`

            const indexFilePath = scanReferenceResult.catalog.index?.path
            if (indexFilePath) {
              s``
              s`export { default as IndexComponent } from '${indexFilePath}'`
            } else {
              s``
              s`export const IndexComponent = null`
            }

            // Encode the catalog to ensure proper serialization
            const encodedCatalog = Catalog.encodeSync(scanReferenceResult.catalog)

            s``
            s`const catalogData = ${JSON.stringify(encodedCatalog)}`
            s``
            s`export const referenceCatalog = Catalog.decodeSync(catalogData)`

            return s.render()
          },
        },
      ),
    },
  ]

  return { plugins, reader }
}
