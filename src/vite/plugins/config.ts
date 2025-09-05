import type { Api } from '#api/$'
import { encodeSyncTemplateConfig, resolve } from '#api/config-template/template'
import type { Examples as ExamplesModule } from '#api/examples/$'
import type { AssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import type { FileSystem } from '@effect/platform'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Effect } from 'effect'
import type * as Vite from 'vite'
import { polenVirtual } from '../vi.js'

export const viProjectConfig = polenVirtual([`project`, `config`])

export interface Options {
  config: Api.Config.Config
  schemaReader: AssetReader<Api.Schema.InputSource.LoadedCatalog | null, any, FileSystem.FileSystem>
  examplesReader: AssetReader<ExamplesModule.ScanResult, any, FileSystem.FileSystem>
}

/**
 * Config plugin that provides resolved template configuration
 */
export const Config = ({
  config,
  schemaReader,
  examplesReader,
}: Options): Vite.Plugin => {
  const debug = debugPolen.sub(`vite-config`)

  return {
    name: 'polen:config-virtual',
    ...ViteVirtual.IdentifiedLoader.toHooks({
      identifier: viProjectConfig,
      async loader() {
        debug(`Loading viProjectConfig virtual module`)

        // Load all catalogs
        const loadedSchemaCatalog = await Effect.runPromise(
          schemaReader.read().pipe(Effect.provide(NodeFileSystem.layer)),
        )
        const loadedExamplesCatalog = await Effect.runPromise(
          examplesReader.read().pipe(Effect.provide(NodeFileSystem.layer)),
        )

        const templateConfig = resolve(config, {
          // @claude todo: on loaded data structure, rename catalog to data
          examples: loadedExamplesCatalog.catalog,
          schemas: loadedSchemaCatalog?.data ?? undefined,
        })

        // @claude run decodeSync on the export
        return `export const templateConfig = ${JSON.stringify(encodeSyncTemplateConfig(templateConfig))}`
      },
    }),
  }
}
