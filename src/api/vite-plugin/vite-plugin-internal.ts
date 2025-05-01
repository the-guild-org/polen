import type { Configurator } from '../../api/configurator/index.js'
import type { Vite } from '#dep/vite/index.js'
import ReactVite from '@vitejs/plugin-react-swc'
import { Build } from './plugins/build.js'
import { Serve } from './plugins/serve.js'
import { Core } from './plugins/core.js'
import { resolveLocalImport } from '../../source-paths.js'

export const VitePluginInternal = (
  config: Configurator.Config,
): Vite.PluginOption => {
  return [
    {
      name: `debug`,
      resolveId(id) {
        return resolveLocalImport(id) ?? undefined
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
