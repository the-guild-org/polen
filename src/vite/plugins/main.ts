import type { Api } from '#api/$'
import type { Vite } from '#dep/vite/index'
import { Manifest } from '#vite/plugins/manifest'
// TODO: Fix vite-plugin-ssr-css compatibility with Rolldown/virtual modules
// import { vitePluginSsrCss } from '@hiogawa/vite-plugin-ssr-css'
import ViteReact from '@vitejs/plugin-react'
import { FsLoc } from '@wollybeard/kit'
import Inspect from 'vite-plugin-inspect'
import { Branding } from './branding.js'
import { Build } from './build.js'
import { Core } from './core.js'
import { PostCSS } from './postcss.js'
import { Serve } from './serve.js'

export const Main = (
  config: Api.Config.Config,
): Vite.PluginOption => {
  const plugins: Vite.PluginOption = []

  // Optional Plugins based on config

  if (config.advanced.explorer) {
    const outputDir = FsLoc.encodeSync(FsLoc.join(config.paths.project.rootDir, FsLoc.fromString(`.bundle-explorer`)))
    const plugin = Inspect({
      build: true,
      outputDir,
    })
    plugins.push(plugin)
  }

  plugins.push(
    ViteReact(),
    PostCSS(config),
    // TODO: Fix vite-plugin-ssr-css compatibility with Rolldown/virtual modules
    // vitePluginSsrCss({
    //   entries: [`/${config.paths.framework.template.relative.client.entrypoint}`],
    // }),
    Branding(config),
    Manifest(config),
    Serve(config),
    Core(config),
    Build(config),
  )

  return plugins
}
