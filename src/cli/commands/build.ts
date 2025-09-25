import { Api } from '#api/$'
import { Op, S } from '#dep/effect'
import { Ef } from '#dep/effect'
import { Command, Options } from '@effect/cli'
import { NodeFileSystem } from '@effect/platform-node'
import { FsLoc } from '@wollybeard/kit'
import { allowGlobalParameter, projectParameter } from '../_/parameters.js'

// Define all the options exactly matching the original
const debug = Options.boolean('debug').pipe(
  Options.withAlias('d'),
  Options.withDefault(false),
  Options.withDescription('Enable debug mode'),
)

const architecture = Options.choice('architecture', ['ssg', 'ssr']).pipe(
  Options.withAlias('a'),
  Options.withDefault('ssg' as const),
  Options.withDescription('Which kind of application architecture to output.'),
)

const base = Options.text('base').pipe(
  Options.withAlias('b'),
  Options.optional,
  Options.withDescription('Base public path for deployment (e.g., /my-project/)'),
)

const port = Options.integer('port').pipe(
  Options.optional,
  Options.withDescription('Default port for the SSR application'),
)

export const build = Command.make(
  'build',
  {
    debug,
    project: projectParameter,
    architecture,
    base,
    port,
    allowGlobal: allowGlobalParameter,
  },
  ({ debug, project, architecture, base, port, allowGlobal }) =>
    Ef.gen(function*() {
      const dir = Op.getOrElse(
        Op.map(project, p => S.decodeSync(FsLoc.AbsDir.String)(p)),
        () => S.decodeSync(FsLoc.AbsDir.String)(process.cwd()),
      )

      const isValidProject = yield* Api.Project.validateProjectDirectory(dir).pipe(
        Ef.provide(NodeFileSystem.layer),
      )
      if (!isValidProject) {
        return yield* Ef.fail(new Error('Invalid project directory'))
      }

      yield* Api.Builder.build({
        dir: FsLoc.encodeSync(dir),
        overrides: {
          build: {
            architecture,
            base: Op.getOrUndefined(base),
          },
          server: {
            port: Op.getOrUndefined(port),
          },
          advanced: {
            debug,
          },
        },
      })
    }),
)
