import { Api } from '#api/$'
import { O } from '#dep/effect'
import { Args, Command, Options } from '@effect/cli'
import { NodeFileSystem } from '@effect/platform-node'
import { Effect } from 'effect'
import { allowGlobalParameter } from '../../_/parameters.js'

const source = Args.text({ name: 'source' }).pipe(
  Args.withDescription('Path to the Polen build directory to rebase'),
)

const newBasePath = Args.text({ name: 'newBasePath' }).pipe(
  Args.withDescription('New base path for the build (e.g., /new-path/)'),
)

const target = Options.text('target').pipe(
  Options.withAlias('t'),
  Options.optional,
  Options.withDescription('Target directory for copy mode (if not provided, mutate in place)'),
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
    Effect.gen(function*() {
      const targetPath = O.getOrUndefined(target)
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

      // Direct Effect execution with timing and error handling
      const start = Date.now()

      const result = yield* Api.Static.rebase(plan).pipe(
        Effect.provide(NodeFileSystem.layer),
        Effect.tap(() => {
          const duration = Date.now() - start
          console.log(`Task: rebase`)
          console.log(`Duration: ${duration}ms`)
          console.log(`Input: ${JSON.stringify(plan, null, 2)}`)
        }),
        Effect.tapError((error) => {
          const duration = Date.now() - start
          console.error(`Task: rebase failed`)
          console.error(`Duration: ${duration}ms`)
          console.error(`Error:`, error)
          return Effect.succeed(undefined)
        }),
      )

      return result
    }),
)
