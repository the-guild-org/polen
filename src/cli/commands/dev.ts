import { Command, Options } from '@effect/cli'
import { Console, Effect, Option } from 'effect'
import * as Vite from 'vite'
import { ViteController } from '../../vite-controller/_namespace.js'

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
  schema: Options.text('schema').pipe(
    Options.withDescription('Path to GraphQL schema file'),
    Options.withAlias('s'),
    Options.withDefault('./schema.graphql'),
  ),
}

export const devCommand = Command.make(
  'dev',
  options,
  ({ open, port, schema }) =>
    Effect.gen(function*() {
      try {
        // Log startup information
        yield* Console.log(`Starting Pollen development server...`)
        yield* Console.log(`Using schema file: ${schema}`)

        // Get port from option
        const portValue = Option.getOrUndefined(port)

        // Create and configure the server
        const server = yield* Effect.tryPromise(() =>
          Vite.createServer(ViteController.createDevConfig({
            schemaPath: schema,
            open,
            ...(portValue !== undefined ? { port: portValue } : {}),
          }))
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
    }),
)
