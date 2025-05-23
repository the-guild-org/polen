import { Vite } from '#dep/vite/index.js'
import { Fs, Path } from '@wollybeard/kit'
import { logger } from './vite/logger.js'

export const loadConfig = async (args: {
  env: Vite.ConfigEnv
  dir?: string
}): Promise<Vite.UserConfig> => {
  const { env } = args
  const dir = Path.ensureAbsoluteWithCWD(args.dir ?? process.cwd())

  const configFilePath = Path.ensureAbsolute(`polen.config.ts`, dir)

  if (!await Fs.exists(configFilePath)) {
    return {}
  }

  const loaded = await Vite.loadConfigFromFile(
    env,
    configFilePath,
    dir,
    undefined,
    logger,
  )

  const config = loaded?.config ?? {}

  return config
}
