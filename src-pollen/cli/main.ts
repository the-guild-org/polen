/**
 * Pollen CLI application using Effect for functional composition and error handling
 * Usage: pnpm pollen <command> [...args]
 */
import { Command } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, pipe } from "effect"

// Import commands
import { devCommand } from "./commands/dev.js"

/**
 * Main CLI application definition
 */
const pollenCommand = pipe(
  Command.make("pollen", {}, () => 
    pipe(
      Console.log("Pollen: Vite webapp development toolkit"),
      Effect.flatMap(() => Console.log("\nAvailable commands:")),
      Effect.flatMap(() => Console.log("  dev     Start the development server"))
    )
  ),
  Command.withSubcommands([devCommand]),
  Command.withDescription("Command-line tools for Vite webapp development and management")
)

/**
 * Configure and run the CLI application
 */
const cli = Command.run(pollenCommand, {
  name: "Pollen CLI",
  version: "v1.0.0"
})

// Execute with Node.js context and runtime
cli(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
