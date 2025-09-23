import { ConfigResolver } from '#api/config-resolver/index'
import { Ef } from '#dep/effect'
import { Vite } from '#dep/vite/index'
import { toViteUserConfig } from '#vite/config'
import { FileSystem } from '@effect/platform/FileSystem'
import { Fs, FsLoc } from '@wollybeard/kit'
import consola from 'consola'
import type { Config } from '../config/$.js'
import { generate } from './ssg/generate.js'

interface BuildInput {
  dir: string
  overrides?: Partial<Config.ConfigInput>
}

export const build = (input: BuildInput): Ef.Effect<void, Error, FileSystem> =>
  Ef.gen(function*() {
    const dir = FsLoc.AbsDir.decodeSync(input.dir.endsWith('/') ? input.dir : `${input.dir}/`)
    const polenConfig = yield* ConfigResolver.fromFile({
      dir,
      overrides: input.overrides,
    })

    const viteUserConfig = toViteUserConfig(polenConfig)

    const builder = yield* Ef.tryPromise({
      try: () => Vite.createBuilder(viteUserConfig),
      catch: (error) => new Error(`Failed to create Vite builder: ${error}`),
    })

    yield* Ef.tryPromise({
      try: () => builder.buildApp(),
      catch: (error) => new Error(`Failed to build app: ${error}`),
    })

    const architecture = viteUserConfig._polen.build.architecture
    if (architecture === `ssg`) {
      // Run SSG generation directly from the builder
      yield* generate(viteUserConfig._polen)

      // Clean up server file which is not needed for static sites
      const serverEntrypoint = viteUserConfig._polen.paths.project.absolute.build.serverEntrypoint
      const exists = yield* Fs.exists(serverEntrypoint)
      if (exists) {
        yield* Fs.remove(serverEntrypoint)
      }

      // todo: there is also some kind of prompt js asset that we probably need to clean up or review...
      consola.info(`try it: npx serve ${viteUserConfig._polen.paths.project.relative.build.root} -p 4000`)
    } else if (architecture === `ssr`) {
      consola.info(`try it: node ${viteUserConfig._polen.paths.project.relative.build.root}/app.js`)
      consola.info(`Then visit http://localhost:${viteUserConfig._polen.server.port}`)
    }
  })
