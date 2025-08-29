import { Api } from '#api/index'
import { Vite } from '#dep/vite/index'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { toViteUserConfig } from '#vite/config'
import { Command, Options } from '@effect/cli'
import { Err } from '@wollybeard/kit'
import { Effect, Option } from 'effect'
import { allowGlobalParameter, projectParameter } from '../_/parameters.js'

// Define all the options exactly matching the original
const debug = Options.boolean('debug').pipe(
  Options.withAlias('d'),
  Options.optional,
  Options.withDescription('Enable debug mode'),
)

const base = Options.text('base').pipe(
  Options.withAlias('b'),
  Options.optional,
  Options.withDescription('Base public path for deployment (e.g., /my-project/)'),
)

const port = Options.integer('port').pipe(
  Options.optional,
  Options.withDescription('Port to run the development server on'),
)

export const dev = Command.make(
  'dev',
  {
    debug,
    project: projectParameter,
    base,
    port,
    allowGlobal: allowGlobalParameter,
  },
  ({ debug, project, base, port, allowGlobal }) =>
    Effect.gen(function*() {
      const dir = ensureOptionalAbsoluteWithCwd(Option.getOrUndefined(project))

      const isValidProject = yield* Effect.promise(() => Api.Project.validateProjectDirectory(dir))
      if (!isValidProject) {
        return yield* Effect.fail(new Error('Invalid project directory'))
      }

      const polenConfig = yield* Api.ConfigResolver.fromFile({
        dir,
        overrides: {
          build: {
            base: Option.getOrUndefined(base),
          },
          server: {
            port: Option.getOrUndefined(port),
          },
          advanced: {
            debug: Option.getOrUndefined(debug),
          },
        },
      })

      const viteUserConfig = toViteUserConfig(polenConfig)
      const viteDevServerResult = yield* Effect.promise(() => Err.tryCatch(() => Vite.createServer(viteUserConfig)))

      if (Err.is(viteDevServerResult)) {
        Err.log(viteDevServerResult)
        return yield* Effect.fail(new Error('Failed to create Vite dev server'))
      }

      yield* Effect.promise(() => viteDevServerResult.listen())
      viteDevServerResult.printUrls()
    }),
)
