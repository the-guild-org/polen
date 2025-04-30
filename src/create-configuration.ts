import { VitePluginInternal } from './api/vite-plugin/vite-plugin-internal.js'
import { Configurator } from './api/configurator/index.js'
import { Vite } from './lib-dependencies/vite/index.js'

export interface ViteUserConfigWithPolen extends Vite.UserConfig {
  _polen: {
    input: Configurator.ConfigInput,
    normalized: Configurator.Config,
  }
}

/**
 * Create a Vite configuration. Thin wrapper around {@link Vite.defineConfig}.
 */
export const createConfiguration = (
  configInput: Configurator.ConfigInput,
): ViteUserConfigWithPolen => {
  const polenConfig = Configurator.normalizeInput(configInput)
  // polenConfig

  const baseConfig = Vite.defineConfig({
    plugins: [VitePluginInternal(polenConfig)],
  })

  const mergedConfig = configInput.vite
    ? Vite.mergeConfig(baseConfig, configInput.vite)
    : baseConfig

  return {
    ...mergedConfig,
    _polen: {
      input: configInput,
      normalized: polenConfig,
    },
  }
}
