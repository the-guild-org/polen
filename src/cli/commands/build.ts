import { Api } from '#api/$'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { Command, Options } from '@effect/cli'
import { Effect, Option } from 'effect'
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
      const dir = ensureOptionalAbsoluteWithCwd(Option.getOrUndefined(project))

      const isValidProject = yield* Effect.promise(() => Api.Project.validateProjectDirectory(dir))
      if (!isValidProject) {
        return yield* Effect.fail(new Error('Invalid project directory'))
      }

      yield* Api.Builder.build({
        dir,
        overrides: {
          build: {
            architecture,
            base: Option.getOrUndefined(base),
          },
          server: {
            port: Option.getOrUndefined(port),
          },
          advanced: {
            debug,
          },
        },
      })
    }),
)
