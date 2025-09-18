import { Api } from '#api/$'
import { O } from '#dep/effect'
import { Command, Options } from '@effect/cli'
import { NodeFileSystem } from '@effect/platform-node'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'
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
    Effect.gen(function*() {
      const dir = Path.ensureOptionalAbsoluteWithCwd(O.getOrUndefined(project))

      const isValidProject = yield* Api.Project.validateProjectDirectory(dir).pipe(
        Effect.provide(NodeFileSystem.layer),
      )
      if (!isValidProject) {
        return yield* Effect.fail(new Error('Invalid project directory'))
      }

      yield* Api.Builder.build({
        dir,
        overrides: {
          build: {
            architecture,
            base: O.getOrUndefined(base),
          },
          server: {
            port: O.getOrUndefined(port),
          },
          advanced: {
            debug,
          },
        },
      })
    }),
)
