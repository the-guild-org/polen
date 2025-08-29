import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform/FileSystem'
import { Effect } from 'effect'
import type { ConfigInput } from '../config/$$.js'
import { mergeInputs } from '../config/input.js'
import { load, type LoadOptions } from '../config/load.js'
import type { Config } from '../config/normalized.js'
import { normalizeInput } from '../config/normalized.js'

interface ResolveFromFileOptions extends LoadOptions {
  overrides?: ConfigInput | undefined
}

export const fromFile = (options: ResolveFromFileOptions): Effect.Effect<Config, Error, FileSystem> =>
  Effect.gen(function*() {
    const configInput = yield* load(options)
    const configInputMerged = mergeInputs(configInput, options.overrides)
    const config = yield* fromMemory(configInputMerged, options.dir)
    debugPolen(`resolved config`, config)
    return config
  })

export const fromMemory = (
  input: ConfigInput,
  /**
   * Refer to `baseRootDirPath` parameter on {@link normalizeInput}.
   *
   * @default `process.cwd()`
   */
  baseRootDirPath?: string,
): Effect.Effect<Config, Error, never> => {
  return normalizeInput(input, baseRootDirPath ?? process.cwd())
}
