import type { Api } from '#api/$'
import { encodeSyncTemplateConfig, resolve } from '#api/config-template/template'
import type { Examples as ExamplesModule } from '#api/examples/$'
import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'
import type { AssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import type { FileSystem } from '@effect/platform'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
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
        const loadedSchemaCatalog = await Ef.runPromise(
          schemaReader.read().pipe(Ef.provide(NodeFileSystem.layer)),
        )
        const loadedExamplesCatalog = await Ef.runPromise(
          examplesReader.read().pipe(Ef.provide(NodeFileSystem.layer)),
        )

        const templateConfig = resolve(config, {
          // @claude todo: on loaded data structure, rename catalog to data
          examples: loadedExamplesCatalog.catalog,
          schemas: loadedSchemaCatalog ? Op.getOrNull(loadedSchemaCatalog.data) ?? undefined : undefined,
        })

        // @claude run decodeSync on the export
        return `export const templateConfig = ${JSON.stringify(encodeSyncTemplateConfig(templateConfig))}`
      },
    }),
  }
}
