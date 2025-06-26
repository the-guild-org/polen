import { Api } from '#api/index'
import type { Vite } from '#dep/vite/index'
import type { Polen } from '#exports/index'

export const defaultViteConfig: Vite.UserConfig = {
  // Don't override Polen's custom logger which already filters optimization messages
  // customLogger: Vite.createLogger(`silent`, {}),
}

export const pc = (configInput?: Polen.ConfigInput) => {
  return Api.ConfigResolver.fromMemory({
    advanced: {
      vite: {
        ...defaultViteConfig,
        ...configInput?.advanced?.vite,
      },
    },
    ...configInput,
  })
}

export const configMemorySchema = (sdl: string): Polen.ConfigInput[`schema`] => {
  return {
    useDataSources: `memory`,
    dataSources: {
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
    useDataSources: `memory`,
    dataSources: {
      memory: {
        versions: versions.map(version => ({
          date: version.date,
          value: version.sdl,
        })),
      },
    },
  }
}
