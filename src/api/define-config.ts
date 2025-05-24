import { Vite } from '#dep/vite/index.js'
import { Configurator } from './configurator/index.js'
import { Main } from './vite/plugins/main.js'

export interface ViteUserConfigWithPolen extends Vite.UserConfig {
  _polen: {
    input: undefined | Configurator.ConfigInput
    normalized: Configurator.Config
  }
}

/**
 * Create a Vite configuration. Thin wrapper around {@link Vite.defineConfig}.
 */
export const defineConfig = async (
  configInput?: Configurator.ConfigInput,
): Promise<ViteUserConfigWithPolen> => {
  const polenConfig = await Configurator.normalizeInput(configInput)

  const viteConfigFromPolen: Vite.UserConfig = {
    plugins: [Main(polenConfig)],
  }

  const viteConfigMerged = configInput?.advanced?.vite
    ? Vite.mergeConfig(viteConfigFromPolen, configInput.advanced.vite)
    : viteConfigFromPolen

  return {
    ...viteConfigMerged,
    _polen: {
      input: configInput,
      normalized: polenConfig,
    },
  }
}
