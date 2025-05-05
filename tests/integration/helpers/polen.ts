import { Polen } from '../../../src/exports/index.js'
import { Vite } from '#dep/vite/index.js'

export const defaultViteConfig: Vite.UserConfig = {
  customLogger: Vite.createLogger(`silent`, {}),
}

export const pc = (config?: Polen.ConfigInput) => {
  return Polen.createConfiguration({
    vite: {
      ...defaultViteConfig,
      ...config?.vite,
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
