import { Command, Options } from '@effect/cli'
import { Console, Effect, Option, pipe } from 'effect'
import * as Vite from 'vite'

const options = {
  open: Options.boolean('open').pipe(
    Options.withDescription('Open browser window automatically'),
    Options.withAlias('o'),
    Options.withDefault(true),
  ),
  port: Options.integer('port').pipe(
    Options.withDescription('Port to start server on (default: 5173)'),
    Options.withAlias('p'),
    Options.optional,
  ),
}

export const devCommand = Command.make('dev', options, ({ open, port }) =>
  Effect.gen(function*() {
    try {
      // Create and configure the server
      const server = yield* Effect.tryPromise(() =>
        Vite.createServer({
          server: {
            open,
            port: Option.getOrUndefined(port),
          },
        })
      )

      // Start the server
      yield* Effect.tryPromise(() => server.listen())

      // Display URLs
      server.printUrls()

      return server
    } catch (error) {
      // Error handling
      yield* Console.error('Failed to start development server:')
      yield* Console.error(String(error))
      return yield* Effect.fail(error)
    }
  }))
