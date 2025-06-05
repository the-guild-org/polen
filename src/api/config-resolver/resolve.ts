import { type ConfigInput, normalizeInput } from '../config/configurator.js'
import { load, type LoadOptions } from '../config/load.js'
import { mergeInputs } from '../config/merge.js'
import { toViteUserConfig, type ViteUserConfigWithPolen } from './vite.js'

interface ResolveFromFileOptions extends LoadOptions {
  overrides?: ConfigInput
}

export const fromFile = async (options: ResolveFromFileOptions): Promise<ViteUserConfigWithPolen> => {
  const configInput = await load(options)
  const configInputMerged = mergeInputs(configInput, options.overrides)
  return fromMemory(configInputMerged, options.dir)
}

export const fromMemory = async (
  input: ConfigInput,
  /**
   * Refer to `baseRootDirPath` parameter on {@link normalizeInput}.
   *
   * @defaultValue `process.cwd()`
   */
  baseRootDirPath?: string,
) => {
  const configNormalized = await normalizeInput(input, baseRootDirPath ?? process.cwd())
  const viteUserConfig = toViteUserConfig(configNormalized)
  return viteUserConfig
}
