import { Vite } from '#dep/vite/index.js'
import { Fs, Path } from '@wollybeard/kit'
import type { Configurator } from './configurator/index.js'
import { defineConfig, type ViteUserConfigWithPolen } from './define-config.js'
import { logger } from './vite/logger.js'

export const loadConfig = async (args: {
  env: Vite.ConfigEnv
  dir?: string
  overrides?: Configurator.ConfigInput
}): Promise<ViteUserConfigWithPolen> => {
  const { env } = args
  const dir = Path.ensureAbsoluteWithCWD(args.dir ?? process.cwd())

  const configFilePath = Path.ensureAbsolute(`polen.config.ts`, dir)

  if (!await Fs.exists(configFilePath)) {
    return await defineConfig(args.overrides)
  }

  // We do this for now so we don't have to wrangle importing TS file which may be a pain
  // since its via CLI, no Vite bundle context, maybe we can use the new nodejs flags for parsing TS...
  // or just use tsx
  const loaded = await Vite.loadConfigFromFile(
    env,
    configFilePath,
    dir,
    undefined,
    logger,
  )

  let config: ViteUserConfigWithPolen
  if (loaded) {
    // hack: do one read
    const config_ = loaded.config as ViteUserConfigWithPolen
    const input = config_._polen.input
    config = await defineConfig({
      ...input,
      build: {
        ...input?.build,
        ...args.overrides?.build,
      },
      advanced: {
        ...input?.advanced,
        ...args.overrides?.advanced,
      },
    })
  } else {
    config = await defineConfig(args.overrides)
  }
  // dump(config)

  return config
}
