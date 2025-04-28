import type { Configurator } from '../configurator/index.js'
import type { Vite } from '../lib/vite/_namespace.js'
import ReactVite from '@vitejs/plugin-react-swc'
import { Build } from './plugins/build.js'
import { Serve } from './plugins/serve.js'
import { Core } from './plugins/core.js'

export const VitePluginInternal = (
  config: Configurator.Config,
): Vite.PluginOption => {
  return [
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
