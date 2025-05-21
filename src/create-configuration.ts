import { Vite } from '#dep/vite/index.js'
import { Configurator } from './api/configurator/index.js'
import { VitePluginInternal } from './api/vite-plugin/vite-plugin-internal.js'

export interface ViteUserConfigWithPolen extends Vite.UserConfig {
  _polen: {
    input: Configurator.ConfigInput
    normalized: Configurator.Config
  }
}

/**
 * Create a Vite configuration. Thin wrapper around {@link Vite.defineConfig}.
 */
export const defineConfig = async (
  configInput: Configurator.ConfigInput,
): Promise<ViteUserConfigWithPolen> => {
  const polenConfig = await Configurator.normalizeInput(configInput)

  const baseConfig = Vite.defineConfig({
    root: polenConfig.root,
    plugins: [VitePluginInternal(polenConfig)],
  })

  const mergedConfig = configInput.advanced?.vite
    ? Vite.mergeConfig(baseConfig, configInput.advanced.vite)
    : baseConfig

  return {
    ...mergedConfig,
    _polen: {
      input: configInput,
      normalized: polenConfig,
    },
  }
}
