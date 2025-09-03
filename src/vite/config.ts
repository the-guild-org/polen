import type { Api } from '#api/$'
import { Vite } from '#dep/vite/index'
import { Main } from './plugins/main.js'

/**
 * Transform Polen config into a Vite configuration.
 */
export const toViteUserConfig = (
  config: Api.Config.Config,
): ViteUserConfigWithPolen => {
  const viteUserConfigFromPolen: Vite.UserConfig = {
    base: config.build.base,
    plugins: [Main(config)],
  }

  const viteUserConfigMerged = (config.advanced.vite
    ? Vite.mergeConfig(viteUserConfigFromPolen, config.advanced.vite)
    : viteUserConfigFromPolen) as ViteUserConfigWithPolen

  viteUserConfigMerged._polen = config

  return viteUserConfigMerged
}

export interface ViteUserConfigWithPolen extends Vite.UserConfig {
  _polen: Api.Config.Config
}
