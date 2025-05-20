import type { Configurator } from '../../api/configurator/index.js'
import type { Vite } from '#dep/vite/index.js'
import ReactVite from '@vitejs/plugin-react-swc'
import { Build } from './plugins/build.js'
import { Serve } from './plugins/serve.js'
import { Core } from './plugins/core.js'
import Inspect from 'vite-plugin-inspect'
import { Arr } from '@wollybeard/kit'
import Restart from 'vite-plugin-restart'
// import { resolveLocalImport } from '../../source-paths.js'

export const VitePluginInternal = (
  config: Configurator.Config,
): Vite.PluginOption => {
  const plugins: Vite.PluginOption = []

  // Optional Plugins based on config

  if (config.explorer) {
    const plugin = Inspect({
      build: true,
      outputDir: `./.bundle-explorer`,
    })
    plugins.push(plugin)
  }

  if (Arr.isNotEmpty(config.watch.also)) {
    const plugin = Restart({
      restart: config.watch.also,
    })
    plugins.push(plugin)
  }

  // Required Plugins

  plugins.push(
    // {
    //   name: `debug`,
    //   resolveId(id) {
    //     return resolveLocalImport(id) ?? undefined
    //   },
    // },
    ReactVite({
      jsxImportSource: `polen/dependencies/react`,
    }),
    Core(config),
    Serve({
      entryServer: config.paths.appTemplate.entryServer,
    }),
    Build({
      entryServerPath: config.paths.appTemplate.entryServer,
      clientEntryPath: config.paths.appTemplate.entryClient,
      debug: true,
    }),
  )

  return plugins
}

// todo: rather than current __prop system
// declare module 'vite' {
//   interface UserConfig {
//     polen?: Configurator.ConfigInput
//   }
// }
