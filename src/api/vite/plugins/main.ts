import type { Vite } from '#dep/vite/index.js'
import ViteReact from '@vitejs/plugin-react'
import { Arr, Path } from '@wollybeard/kit'
import Inspect from 'vite-plugin-inspect'
import Restart from 'vite-plugin-restart'
import type { Configurator } from '../../configurator/index.js'
import { Build } from './build.js'
import { Core } from './core.js'
import { Serve } from './serve.js'

export const Main = (
  config: Configurator.Config,
): Vite.PluginOption => {
  const plugins: Vite.PluginOption = []

  // Optional Plugins based on config

  if (config.advanced.explorer) {
    const outputDir = Path.join(config.paths.project.rootDir, `.bundle-explorer`)
    const plugin = Inspect({
      build: true,
      outputDir,
    })
    plugins.push(plugin)
  }

  if (Arr.isntEmpty(config.watch.also)) {
    const plugin = Restart({
      restart: config.watch.also,
    })
    plugins.push(plugin)
  }

  plugins.push(
    ViteReact(),
    Core(config),
    Serve(config),
    Build(config),
  )

  return plugins
}
