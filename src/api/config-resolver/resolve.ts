import { debugPolen } from '#singletons/debug'
import type { Config } from '../config/configurator.js'
import { type ConfigInput, normalizeInput } from '../config/configurator.js'
import { load, type LoadOptions } from '../config/load.js'
import { mergeInputs } from '../config/merge.js'

interface ResolveFromFileOptions extends LoadOptions {
  overrides?: ConfigInput | undefined
}

export const fromFile = async (options: ResolveFromFileOptions): Promise<Config> => {
  const configInput = await load(options)
  const configInputMerged = mergeInputs(configInput, options.overrides)
  const config = await fromMemory(configInputMerged, options.dir)
  debugPolen(`resolved config`, config)
  return config
}

export const fromMemory = async (
  input: ConfigInput,
  /**
   * Refer to `baseRootDirPath` parameter on {@link normalizeInput}.
   *
   * @default `process.cwd()`
   */
  baseRootDirPath?: string,
): Promise<Config> => {
  const configNormalized = await normalizeInput(input, baseRootDirPath ?? process.cwd())
  return configNormalized
}
