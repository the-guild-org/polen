import { Api } from '#api/index'
import type { Vite } from '#dep/vite/index'
import type { Polen } from '#exports/index'
import { toViteUserConfig } from '#vite/config'
import { Effect } from 'effect'

export const defaultViteConfig: Vite.UserConfig = {
  // Don't override Polen's custom logger which already filters optimization messages
  // customLogger: Vite.createLogger(`silent`, {}),
}

export const pc = async (configInput?: Polen.ConfigInput, baseRootDirPath?: string) => {
  const polenConfig = await Effect.runPromise(
    Api.ConfigResolver.fromMemory({
      advanced: {
        vite: {
          ...defaultViteConfig,
          ...configInput?.advanced?.vite,
        },
      },
      ...configInput,
    }, baseRootDirPath),
  )
  return toViteUserConfig(polenConfig)
}

export const configMemorySchema = (sdl: string): Polen.ConfigInput[`schema`] => {
  return {
    useSources: `memory`,
    sources: {
      memory: {
        versions: [sdl],
      },
    },
  }
}

export const configMemorySchemaVersions = (
  versions: { date: Date; sdl: string }[],
): Polen.ConfigInput[`schema`] => {
  return {
    useSources: `memory`,
    sources: {
      memory: {
        versions: versions.map(version => ({
          date: version.date,
          value: version.sdl,
        })),
      },
    },
  }
}
