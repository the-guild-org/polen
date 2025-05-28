import { Configurator } from '#api/configurator/index.js'
import { loadConfig } from '#api/load-config.js'
import { Vite } from '#dep/vite/index.js'

const buildDefaults = {
  debug: false,
  type: Configurator.BuildArchitecture.enum.ssg,
}

interface BuildConfigInput {
  debug?: boolean
  type?: Configurator.BuildArchitecture
}

export const build = async (buildConfigInput: BuildConfigInput) => {
  const buildConfig = { ...buildDefaults, ...buildConfigInput }

  const config = await loadConfig({
    env: {
      command: `build`,
      mode: `production`,
    },
    overrides: {
      build: {
        type: buildConfig.type,
      },
      advanced: {
        debug: buildConfig.debug,
      },
    },
  })

  const builder = await Vite.createBuilder(config)
  await builder.buildApp()

  if (buildConfig.type === `ssg`) {
    const entryFilePath = config._polen.normalized.paths.project.absolute.build.root + `/entry.js`
    await import(entryFilePath)
  }
}
