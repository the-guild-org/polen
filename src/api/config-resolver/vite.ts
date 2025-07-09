import { Main } from '#api/vite/plugins/main'
import { Vite } from '#dep/vite/index'
import type { Config } from '../config/configurator.js'

/**
 * Transform Polen config input into a Vite configuration.
 */
export const toViteUserConfig = (
  config: Config,
): ViteUserConfigWithPolen => {
  const viteUserConfigFromPolen: Vite.UserConfig = {
    base: config.build.base,
    plugins: [Main(config)],
    server: {
      port: 3000,
      fs: {
        strict: false,
        allow: [config.paths.project.rootDir],
      },
    },
    environments: {
      // RSC environment for React Server Components
      rsc: {
        build: {
          outDir: `${config.paths.project.absolute.build.root}/rsc`,
          rollupOptions: {
            input: {
              index: config.paths.framework.template.absolute.rsc.entrypoint,
            },
          },
        },
      },
      // SSR environment for server-side rendering
      ssr: {
        build: {
          outDir: `${config.paths.project.absolute.build.root}/ssr`,
          rollupOptions: {
            input: {
              // Use the single entry point that loads RSC
              index: config.paths.framework.template.absolute.ssr.entrypoint.replace('.tsx', '.single.tsx'),
            },
          },
        },
      },
      // Client environment for browser
      client: {
        build: {
          outDir: `${config.paths.project.absolute.build.root}/client`,
          rollupOptions: {
            input: {
              index: config.paths.framework.template.absolute.client.entrypoint,
            },
          },
        },
      },
    },
  }

  const viteUserConfigMerged = config.advanced.vite
    ? Vite.mergeConfig(viteUserConfigFromPolen, config.advanced.vite)
    : viteUserConfigFromPolen

  return {
    ...viteUserConfigMerged,
    _polen: config,
  }
}

export interface ViteUserConfigWithPolen extends Vite.UserConfig {
  _polen: Config
}
