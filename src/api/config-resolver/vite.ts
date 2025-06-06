import { Main } from '#api/vite/plugins/main.ts'
import { Vite } from '#dep/vite/index.ts'
import type { Config } from '../config/configurator.ts'

/**
 * Transform Polen config input into a Vite configuration.
 */
export const toViteUserConfig = (
  config: Config,
): ViteUserConfigWithPolen => {
  const viteUserConfigFromPolen: Vite.UserConfig = {
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
