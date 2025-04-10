import { VitePlugin } from './vite-plugin/_exports.js'
import type { Configurator } from './configurator/_namespace.js'
import { Vite } from './lib/vite/_namespace.js'

/**
 * Create a Vite configuration. Thin wrapper around {@link Vite.defineConfig}.
 */
export const defineConfiguration = (configInput: Configurator.ConfigInput): Vite.UserConfig => {
  const baseConfig = Vite.defineConfig({
    plugins: [VitePlugin(configInput)],
  })

  const mergedConfig = configInput.vite
    ? Vite.mergeConfig(baseConfig, configInput.vite)
    : baseConfig

  return mergedConfig
}
