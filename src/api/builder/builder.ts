import { ConfigResolver } from '#api/config-resolver/index'
import { Config } from '#api/config/index'
import { Vite } from '#dep/vite/index'
import { Fs } from '@wollybeard/kit'
import consola from 'consola'

interface BuildConfigInput {
  dir: string
  architecture?: Config.BuildArchitecture
  base?: string
  server?: {
    port?: number
  }
  advanced?: {
    debug?: boolean
  }
}

export const build = async (input: BuildConfigInput) => {
  const viteUserConfig = await ConfigResolver.fromFile({
    dir: input.dir,
    overrides: input,
  })

  const builder = await Vite.createBuilder(viteUserConfig)
  await builder.buildApp()

  if (input.architecture === `ssg`) {
    consola.info(`Generating static site...`)
    await import(viteUserConfig._polen.paths.project.absolute.build.serverEntrypoint)
    // Clean up server file which should now be done being used for SSG geneation.
    await Fs.remove(viteUserConfig._polen.paths.project.absolute.build.serverEntrypoint)
    // todo: there is also some kind of prompt js asset that we probably need to clean up or review...
    consola.success(`Done`)
    consola.info(`try it: npx serve ${viteUserConfig._polen.paths.project.relative.build.root} -p 4000`)
  } else if (input.architecture === `ssr`) {
    consola.info(`try it: node ${viteUserConfig._polen.paths.project.relative.build.root}/app.js`)
    consola.info(`Then visit http://localhost:${viteUserConfig._polen.server.port}`)
  }
}
