import { ConfigResolver } from '#api/config-resolver/index'
import type { ConfigInput } from '#api/config/configurator'
import { Vite } from '#dep/vite/index'
import { toViteUserConfig } from '#vite/config'
import { Fs } from '@wollybeard/kit'
import consola from 'consola'
import { generate } from './ssg/generate.js'

interface BuildInput {
  dir: string
  overrides?: Partial<ConfigInput>
}

export const build = async (input: BuildInput) => {
  const polenConfig = await ConfigResolver.fromFile({
    dir: input.dir,
    overrides: input.overrides,
  })

  const viteUserConfig = toViteUserConfig(polenConfig)
  const builder = await Vite.createBuilder(viteUserConfig)
  await builder.buildApp()

  const architecture = viteUserConfig._polen.build.architecture
  if (architecture === `ssg`) {
    // Run SSG generation directly from the builder
    await generate(viteUserConfig._polen)
    // Clean up server file which is not needed for static sites
    await Fs.remove(viteUserConfig._polen.paths.project.absolute.build.serverEntrypoint)
    // todo: there is also some kind of prompt js asset that we probably need to clean up or review...
    consola.info(`try it: npx serve ${viteUserConfig._polen.paths.project.relative.build.root} -p 4000`)
  } else if (architecture === `ssr`) {
    consola.info(`try it: node ${viteUserConfig._polen.paths.project.relative.build.root}/app.js`)
    consola.info(`Then visit http://localhost:${viteUserConfig._polen.server.port}`)
  }
}
