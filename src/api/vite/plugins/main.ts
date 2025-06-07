import type { Config } from '#api/config/index.js'
import type { Vite } from '#dep/vite/index.js'
import ViteReact from '@vitejs/plugin-react-oxc'
// import { Arr, Path } from '@wollybeard/kit'
// import Inspect from 'vite-plugin-inspect'
// import Restart from 'vite-plugin-restart'
import { Build } from './build.ts'
import { Core } from './core.ts'
import { Serve } from './serve.ts'

export const Main = (
  config: Config.Config,
): Vite.PluginOption => {
  const plugins: Vite.PluginOption = []

  // Optional Plugins based on config
  // TODO: Re-enable when compatible with Rolldown

  // if (config.advanced.explorer) {
  //   const outputDir = Path.join(config.paths.project.rootDir, `.bundle-explorer`)
  //   const plugin = Inspect({
  //     build: true,
  //     outputDir,
  //   })
  //   plugins.push(plugin)
  // }

  // if (Arr.isntEmpty(config.watch.also)) {
  //   const plugin = Restart({
  //     restart: config.watch.also,
  //   })
  //   plugins.push(plugin)
  // }

  plugins.push(
    ViteReact(),
    Core(config),
    Serve(config),
    Build(config),
  )

  return plugins
}
