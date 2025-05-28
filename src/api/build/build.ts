import { Configurator } from '#api/configurator/index.js'
import { loadConfig } from '#api/load-config.js'
import { Vite } from '#dep/vite/index.js'
import consola from 'consola'

const buildDefaults = {
  debug: false,
  type: Configurator.BuildTypeEnum.ssg,
}

interface BuildConfigInput {
  debug?: boolean
  type?: Configurator.BuildType
}

export const build = async (buildConfigInput: BuildConfigInput) => {
  const buildConfig = { ...buildDefaults, ...buildConfigInput }

  if (buildConfig.type === `spa`) {
    consola.error(`Sorry, SPA builds are not supported yet.`)
    process.exit(1)
  }

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
