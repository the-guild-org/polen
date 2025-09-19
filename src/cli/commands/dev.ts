import { Api } from '#api/$'
import { O } from '#dep/effect'
import { Vite } from '#dep/vite/index'
import { toViteUserConfig } from '#vite/config'
import { Command, Options } from '@effect/cli'
import { NodeFileSystem } from '@effect/platform-node'
import { Err, Path } from '@wollybeard/kit'
import { Effect } from 'effect'
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
      const dir = Path.ensureOptionalAbsoluteWithCwd(O.getOrUndefined(project))

      const isValidProject = yield* Api.Project.validateProjectDirectory(dir).pipe(
        Effect.provide(NodeFileSystem.layer),
      )
      if (!isValidProject) {
        return yield* Effect.fail(new Error('Invalid project directory'))
      }

      const polenConfig = yield* Api.ConfigResolver.fromFile({
        dir,
        overrides: {
          build: {
            base: O.getOrUndefined(base),
          },
          server: {
            port: O.getOrUndefined(port),
          },
          advanced: {
            debug: O.getOrUndefined(debug),
          },
        },
      })

      const viteUserConfig = toViteUserConfig(polenConfig)
      const viteDevServer = yield* Effect.tryPromise({
        try: () => Vite.createServer(viteUserConfig),
        catch: (error) => {
          console.error('Failed to create Vite dev server:', error)
          return new Error(`Failed to create Vite server: ${String(error)}`)
        },
      })

      yield* Effect.tryPromise({
        try: () => viteDevServer.listen(),
        catch: (error) => new Error(`Failed to start dev server: ${String(error)}`),
      })
      viteDevServer.printUrls()
    }),
)
