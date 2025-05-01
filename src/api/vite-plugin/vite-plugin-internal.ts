import type { Configurator } from '../../api/configurator/index.js'
import type { Vite } from '#dep/vite/index.js'
import ReactVite from '@vitejs/plugin-react-swc'
import { Build } from './plugins/build.js'
import { Serve } from './plugins/serve.js'
import { Core } from './plugins/core.js'
import { resolve } from 'resolve.imports'
import { sourcePaths } from 'src/source-paths.js'
import { Path } from '#dep/path/index.js'

export const VitePluginInternal = (
  config: Configurator.Config,
): Vite.PluginOption => {
  return [
    {
      name: `debug`,
      async resolveId(id, importer) {
        // TODO: use packages from vlt
        const { default: { imports } } = await import(`../../../package.json`, {
          with: { type: `json` },
        }) as { default: { imports: Record<string, string> } }

        const isDepAlias = id.includes(`#dep`)
        const isPolenImportAlias = isDepAlias
        const isPolenImporter = importer?.includes(`polen/`)

        if (isPolenImportAlias && isPolenImporter) {
          let resolvedLocalImport = resolve(
            {
              content: { imports },
            },
            id,
            {
              conditions: [`source`],
            },
          )
          if (resolvedLocalImport) {
            if (sourcePaths.isTypeScript) {
              resolvedLocalImport = resolvedLocalImport.replace(`/build/`, `/src/`).replace(
                `.js`,
                `.ts`,
              ).replace(`.jsx`, `.tsx`)
              resolvedLocalImport = Path.join(sourcePaths.dir, `..`, resolvedLocalImport)
            }
            // console.log(id, resolvedLocalImport)
            return resolvedLocalImport
          }
        }

        return undefined
      },
    },
    ReactVite(),
    Core(config),
    Serve({
      entryServer: config.paths.appTemplate.entryServer,
    }),
    Build({
      entryServerPath: config.paths.appTemplate.entryServer,
      clientEntryPath: config.paths.appTemplate.entryClient,
      debug: true,
    }),
  ]
}

// todo: rather than current __prop system
// declare module 'vite' {
//   interface UserConfig {
//     polen?: Configurator.ConfigInput
//   }
// }
