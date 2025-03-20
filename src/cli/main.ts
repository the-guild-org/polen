import { Command } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Effect, Option } from 'effect'

// Import commands
import { devCommand } from './commands/dev.js'
import { buildCommand } from './commands/build.js'

/**
 * Define the main command with subcommands
 */
const pollenCommand = Command.make(`pollen`, {}).pipe(
  Command.withDescription(`Command-line tool for working with the Pollen framework.`),
  Command.withSubcommands([devCommand, buildCommand]),
  Command.withHandler(config =>
    Option.match(config.subcommand, {
      onNone: () =>
        Effect.gen(function*() {
          // todo
          // yield* Console.log(
          // HelpDoc.toAnsiText(Command.getHelp(pollenCommand, CliConfig.defaultConfig))
          // )
          return yield* Effect.void
        }),
      onSome: () => Effect.void,
    })
  ),
)

/**
 * Configure and run the CLI application
 */
const cli = Command.run(pollenCommand.pipe(Command.withSubcommands([devCommand, buildCommand])), {
  name: `Pollen CLI`,
  version: `v1.0.0`,
})

// Run the CLI application
cli(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
)
