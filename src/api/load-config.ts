import { Vite } from '#dep/vite/index.js'
import { Fs, Path } from '@wollybeard/kit'

export const loadConfig = async (args: {
  env: Vite.ConfigEnv
  dir?: string
}): Promise<undefined | Vite.UserConfig> => {
  const { env } = args
  const dir = Path.ensureAbsoluteWithCWD(args.dir ?? process.cwd())

  const configFilePath = Path.ensureAbsolute(`polen.config.ts`, dir)

  if (!await Fs.exists(configFilePath)) {
    return undefined
  }

  const loaded = await Vite.loadConfigFromFile(
    env,
    configFilePath,
    dir,
  )

  return loaded?.config
}
