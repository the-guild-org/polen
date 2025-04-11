import { VitePluginInternal } from './vite-plugin/_exports.js'
import { Configurator } from './configurator/_namespace.js'
import { Vite } from './lib/vite/_namespace.js'

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
