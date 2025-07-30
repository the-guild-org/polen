import type { Config } from '#api/config/configurator'
import { Vite } from '#dep/vite/index'
import { Main } from './plugins/main.js'

/**
 * Transform Polen config into a Vite configuration.
 */
export const toViteUserConfig = (
  config: Config,
): ViteUserConfigWithPolen => {
  const viteUserConfigFromPolen: Vite.UserConfig = {
    base: config.build.base,
    plugins: [Main(config)],
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
