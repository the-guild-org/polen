import { Command } from '@effect/cli'
import $ from 'ansis'
import { Console, Effect } from 'effect'

// Import subcommands
import { staticRebase } from './static/rebase.js'

const h2 = (str: string) => {
  return $.bold.black.bgWhiteBright(` ${str.toUpperCase()} `)
}

const code = (str: string) => {
  if (!$.isSupported()) return `\`${str}\``
  return $.magenta(str)
}

// Default static command that shows usage
const staticDefault = Command.make(
  'static',
  {},
  () =>
    Effect.gen(function*() {
      yield* Console.log(`${$.bold.redBright`POLEN 🌺`} ${$.dim(`static commands`)}`)
      yield* Console.log('Manage static builds and deployments.')
      yield* Console.log('')
      yield* Console.log('')
      yield* Console.log(`${h2('commands')}`)
      yield* Console.log('')
      yield* Console.log(`${$.dim`$ polen static`} ${$.cyanBright('rebase')}`)
      yield* Console.log('')
      yield* Console.log(`${$.dim`Get help for a command with ${code('polen static <command> --help')}`}`)
      yield* Console.log('')
    }),
)

// Export the static command with subcommands
export const staticCommand = staticDefault.pipe(
  Command.withSubcommands([staticRebase]),
)
