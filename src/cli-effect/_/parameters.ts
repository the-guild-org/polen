import { Args, Options } from '@effect/cli'

/**
 * Common parameter schemas for Effect CLI commands
 */

export const projectParameter = Args.text({ name: 'project' }).pipe(
  Args.optional,
  Args.withDescription('The path to the project directory. Default is CWD (current working directory).'),
)

export const allowGlobalParameter = Options.boolean('allow-global').pipe(
  Options.optional,
  Options.withDescription(
    'Allow using global Polen in a project with local Polen. Not recommended as it can cause version conflicts.',
  ),
)
