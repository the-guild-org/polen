import { Command } from '@effect/cli'
import { Console, Effect } from 'effect'

// Import subcommands
import { cacheDelete } from './cache/delete.js'
import { cacheShow } from './cache/show.js'

// Default cache command that shows usage
const cacheDefault = Command.make(
  'cache',
  {},
  () =>
    Effect.gen(function*() {
      yield* Console.error(`Usage: polen cache <command>

Commands:
  delete    Delete all Polen-generated caches
  show      Display information about Polen caches
`)
      return yield* Effect.fail(new Error('No cache subcommand specified'))
    }),
)

// Export the cache command with subcommands
export const cache = cacheDefault.pipe(
  Command.withSubcommands([cacheDelete, cacheShow]),
)
