import { Api } from '#api/$'
import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'
import { Vite } from '#dep/vite/index'
import { toViteUserConfig } from '#vite/config'
import { Command, Options } from '@effect/cli'
import { NodeFileSystem } from '@effect/platform-node'
import { Err, FsLoc } from '@wollybeard/kit'
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
    Ef.gen(function*() {
      const dir = Op.getOrElse(
        Op.map(project, FsLoc.AbsDir.decodeSync),
        () => FsLoc.AbsDir.decodeSync(process.cwd()),
      )

      const isValidProject = yield* Api.Project.validateProjectDirectory(dir).pipe(
        Ef.provide(NodeFileSystem.layer),
      )
      if (!isValidProject) {
        return yield* Ef.fail(new Error('Invalid project directory'))
      }

      const polenConfig = yield* Api.ConfigResolver.fromFile({
        dir,
        overrides: {
          build: {
            base: Op.getOrUndefined(base),
          },
          server: {
            port: Op.getOrUndefined(port),
          },
          advanced: {
            debug: Op.getOrUndefined(debug),
          },
        },
      })

      const viteUserConfig = toViteUserConfig(polenConfig)
      const viteDevServer = yield* Ef.tryPromise({
        try: () => Vite.createServer(viteUserConfig),
        catch: (error) => {
          console.error('Failed to create Vite dev server:', error)
          return new Error(`Failed to create Vite server: ${String(error)}`)
        },
      })

      yield* Ef.tryPromise({
        try: () => viteDevServer.listen(),
        catch: (error) => new Error(`Failed to start dev server: ${String(error)}`),
      })
      viteDevServer.printUrls()
    }),
)
