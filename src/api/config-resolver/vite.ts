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
