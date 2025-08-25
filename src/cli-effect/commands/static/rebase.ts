import { Command, Args, Options } from '@effect/cli'
import { Effect, Option } from 'effect'
import { Api } from '#api/index'
import { allowGlobalParameter } from '../../_/parameters.js'
import { Task } from '#lib/task'

const source = Args.text({ name: 'source' }).pipe(
  Args.withDescription('Path to the Polen build directory to rebase')
)

const newBasePath = Args.text({ name: 'newBasePath' }).pipe(
  Args.withDescription('New base path for the build (e.g., /new-path/)')
)

const target = Options.text('target').pipe(
  Options.withAlias('t'),
  Options.optional,
  Options.withDescription('Target directory for copy mode (if not provided, mutate in place)')
)

export const staticRebase = Command.make(
  'rebase',
  {
    source,
    newBasePath,
    target,
    allowGlobal: allowGlobalParameter,
  },
  ({ source, newBasePath, target, allowGlobal }) =>
    Effect.gen(function* () {
      const targetPath = Option.getOrUndefined(target)
      const plan: Api.Static.RebasePlan = targetPath
        ? {
          changeMode: 'copy',
          sourcePath: source,
          targetPath: targetPath,
          newBasePath,
        }
        : {
          changeMode: 'mutate',
          sourcePath: source,
          newBasePath,
        }

      // Wrap the Promise-based API to make it Effect-based
      const rebaseEffect = (plan: Api.Static.RebasePlan) => Effect.promise(() => Api.Static.rebase(plan))

      yield* Task.runAndExit(rebaseEffect, plan)
    })
)