import type { Api } from '#api/index'
import type { Vite } from '#dep/vite/index'
import { Manifest } from '#vite/plugins/manifest'
import { vitePluginSsrCss } from '@hiogawa/vite-plugin-ssr-css'
import ViteReact from '@vitejs/plugin-react-oxc'
import { Path } from '@wollybeard/kit'
import Inspect from 'vite-plugin-inspect'
import { Branding } from './branding.js'
import { Core } from './core.js'
import { Serve } from './serve.js'

export const Main = (
  config: Api.Config.Config,
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

  plugins.push(
    ViteReact(),
    vitePluginSsrCss({
      entries: [`/${config.paths.framework.template.relative.client.entrypoint}`],
    }),
    Branding(config),
    Manifest(config),
    Serve(config),
    Core(config),
    // Build(config),
  )

  return plugins
}
