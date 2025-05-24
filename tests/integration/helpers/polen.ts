import { Vite } from '#dep/vite/index.js'
import { Polen } from '../../../src/exports/index.js'

export const defaultViteConfig: Vite.UserConfig = {
  customLogger: Vite.createLogger(`silent`, {}),
}

export const pc = (config?: Polen.ConfigInput) => {
  return Polen.defineConfig({
    advanced: {
      vite: {
        ...defaultViteConfig,
        ...config?.advanced?.vite,
      },
    },
    ...config,
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
