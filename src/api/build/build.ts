import { Config } from '#api/config/index.js'
import { loadConfig } from '#api/load-config.js'
import { Vite } from '#dep/vite/index.js'
import { Fs } from '@wollybeard/kit'
import consola from 'consola'

const buildDefaults = {
  debug: false,
  architecture: Config.BuildArchitecture.enum.ssg,
}

interface BuildConfigInput {
  debug?: boolean
  architecture?: Config.BuildArchitecture
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
        architecture: buildConfig.architecture,
      },
      advanced: {
        debug: buildConfig.debug,
      },
    },
  })

  const builder = await Vite.createBuilder(config)
  await builder.buildApp()

  if (buildConfig.architecture === `ssg`) {
    consola.info(`Generating static site...`)
    await import(config._polen.paths.project.absolute.build.serverEntrypoint)
    // Clean up server file which should now be done being used for SSG geneation.
    await Fs.remove(config._polen.paths.project.absolute.build.serverEntrypoint)
    // todo: there is also some kind of prompt js asset that we probably need to clean up or review...
    consola.success(`Done`)
    consola.info(`try it: npx serve ${config._polen.paths.project.relative.build.root} -p 4000`)
  } else if (buildConfig.architecture === `ssr`) {
    consola.info(`try it: node ${config._polen.paths.project.relative.build.root}/app.js`)
    // todo: no hardcoded port
    consola.info(`Then visit http://localhost:3001`)
  }
}
