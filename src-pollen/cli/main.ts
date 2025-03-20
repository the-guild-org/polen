import { CliConfig, Command, HelpDoc } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Console, Effect, Option } from 'effect'

// Import commands
import { devCommand } from './commands/dev.js'

/**
 * Define the main command with subcommands
 */
const pollenCommand = Command.make('pollen', {}).pipe(
  Command.withDescription('Command-line tool for working with the Pollen framework.'),
  Command.withSubcommands([devCommand]),
  Command.withHandler(config =>
    Option.match(config.subcommand, {
      onNone: () =>
        Effect.gen(function*() {
          yield* Console.log(
            HelpDoc.toAnsiText(Command.getHelp(pollenCommand, CliConfig.defaultConfig)),
          )
        }),
      onSome: () => Effect.void,
    })
  ),
)

/**
 * Configure and run the CLI application
 */
const cli = Command.run(pollenCommand.pipe(Command.withSubcommands([devCommand])), {
  name: 'Pollen CLI',
  version: 'v1.0.0',
})

cli(process.argv).pipe(
  // @ts-expect-error fixme
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
)
