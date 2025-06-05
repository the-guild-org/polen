import type { Config } from '#api/config/index.js'
import type { Vite } from '#dep/vite/index.js'
import ViteReact from '@vitejs/plugin-react'
// import { Arr, Path } from '@wollybeard/kit'
// import Inspect from 'vite-plugin-inspect'
// import Restart from 'vite-plugin-restart'
import { Build } from './build.js'
import { Core } from './core.js'
import { Serve } from './serve.js'

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

  // TODO: Remove this wrapper once @vitejs/plugin-react releases the fix for rolldown
  // The fix is merged but not yet released: https://github.com/vitejs/vite-plugin-react/pull/489
  const reactPlugin = ViteReact()
  const reactPlugins = Array.isArray(reactPlugin) ? reactPlugin : [reactPlugin]
  const wrappedReactPlugins = reactPlugins.map(plugin => {
    if (!plugin || typeof plugin !== `object` || !(`name` in plugin)) return plugin

    const vitePlugin = plugin as Vite.Plugin
    return {
      ...vitePlugin,
      config: (config: Vite.UserConfig, env: Vite.ConfigEnv) => {
        const originalConfig = vitePlugin.config
        let result: any

        if (typeof originalConfig === `function`) {
          result = originalConfig.call(undefined, config, env)
        } else if (originalConfig && typeof originalConfig === `object` && `handler` in originalConfig) {
          result = originalConfig.handler.call(undefined, config, env)
        }

        if (result && typeof result === `object` && `optimizeDeps` in result) {
          // eslint-disable-next-line
          const optimizeDeps = result.optimizeDeps
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (optimizeDeps?.esbuildOptions) {
            // Remove esbuildOptions to suppress rolldown warning
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { esbuildOptions: ___, ...restOptimizeDeps } = optimizeDeps

            return {
              ...result,
              // eslint-disable-next-line
              optimizeDeps: restOptimizeDeps,
            }
          }
        }
        return result
      },
    } as Vite.Plugin
  })

  plugins.push(
    ...wrappedReactPlugins,
    Core(config),
    Serve(config),
    Build(config),
  )

  return plugins
}
