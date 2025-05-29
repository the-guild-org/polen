import { Configurator } from '#api/configurator/index.js'
import { loadConfig } from '#api/load-config.js'
import { Vite } from '#dep/vite/index.js'
import { Fs } from '@wollybeard/kit'

const buildDefaults = {
  debug: false,
  type: Configurator.BuildArchitecture.enum.ssg,
}

interface BuildConfigInput {
  debug?: boolean
  architecture?: Configurator.BuildArchitecture
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

  if (buildConfig.architecture === `ssg`) {
    await import(config._polen.normalized.paths.project.absolute.build.serverEntrypoint)
    // Clean up server file which should now be done being used for SSG geneation.
    await Fs.remove(config._polen.normalized.paths.project.absolute.build.serverEntrypoint)
    // todo: there is also some kind of prompt js asset that we probably need to clean up or review...
  }
}
