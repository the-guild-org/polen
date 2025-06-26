import type { Config } from '#api/config/index'
import type { Vite } from '#dep/vite/index'
import { vitePluginSsrCss } from '@hiogawa/vite-plugin-ssr-css'
import ViteReact from '@vitejs/plugin-react-oxc'
import { Path } from '@wollybeard/kit'
// import { Arr, Path } from '@wollybeard/kit'
// import Inspect from 'vite-plugin-inspect'
// import Restart from 'vite-plugin-restart'
import { Branding } from './branding/index.ts'
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

  // Convert absolute path to relative for vite-plugin-ssr-css
  const clientEntryRelative = Path.relative(
    config.paths.framework.rootDir,
    config.paths.framework.template.client.entrypoint
  )

  plugins.push(
    ViteReact(),
    vitePluginSsrCss({ 
      entries: [`/${clientEntryRelative}`] 
    }),
    Branding(config),
    Core(config),
    Serve(config),
    Build(config),
  )

  return plugins
}
