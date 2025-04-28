import { Configurator } from '../configurator/index.js'
import type { Vite } from '../lib-dep/vite/index.js'
import { VitePluginInternal } from './vite-plugin-internal.js'

export const VitePlugin = async (
  polenConfigInput?: Configurator.ConfigInput,
): Promise<Vite.PluginOption> => {
  const polenConfig = Configurator.normalizeInput(polenConfigInput)
  return VitePluginInternal(polenConfig)
}
