import { Command, Options } from "@effect/cli"
import { Console, Effect, Option, pipe } from "effect"
import * as Vite from "vite"

/**
 * Interface for Vite development server options
 */
interface DevOptions {
  readonly open: boolean
  readonly port: Option.Option<number>
}

/**
 * CLI options for development server
 */
const openOption = Options.boolean("open").pipe(
  Options.withDescription("Open browser window automatically"),
  Options.withAlias("o"),
  Options.withDefault(true)
)

const portOption = Options.integer("port").pipe(
  Options.withDescription("Port to start server on (default: 5173)"),
  Options.withAlias("p"),
  Options.optional
)

/**
 * Command configuration options
 */
const options = { open: openOption, port: portOption }

/**
 * Command handler for starting the development server
 */
const devHandler = ({ open, port }: DevOptions) =>
  pipe(
    Effect.sync(() => console.log("Starting Vite development server...")),
    Effect.flatMap(() => 
      Effect.tryPromise(() => 
        Vite.createServer({
          server: {
            open,
            port: Option.getOrUndefined(port)
          }
        })
      )
    ),
    Effect.tap(server => Effect.tryPromise(() => server.listen())),
    Effect.tap(server => Effect.sync(() => server.printUrls())),
    Effect.catchAll(error => 
      pipe(
        Console.error("Failed to start development server:"),
        Effect.flatMap(() => Console.error(String(error))),
        Effect.flatMap(() => Effect.fail(error))
      )
    )
  )

/**
 * Dev command exported for use in the main CLI application
 */
export const devCommand = Command.make("dev", options, devHandler)
