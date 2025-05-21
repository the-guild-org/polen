import { Configurator } from '../../api/configurator/index.js'
import type { Vite } from '#dep/vite/index.js'
import { VitePluginInternal } from './vite-plugin-internal.js'

export const VitePlugin = async (
  polenConfigInput?: Configurator.ConfigInput,
): Promise<Vite.PluginOption> => {
  const polenConfig = await Configurator.normalizeInput(polenConfigInput)
  return VitePluginInternal(polenConfig)
}
