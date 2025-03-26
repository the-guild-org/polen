import { Command, Options } from '@effect/cli'
import { Effect } from 'effect'
import * as Path from 'node:path'
import { TanStackController } from '../../lib/tan-stack-controller/_namespace'

const rootDirectory = Path.join(import.meta.dirname, `../../project`)

const options = {
  // open: Options.boolean(`open`).pipe(
  //   Options.withDescription(`Open browser window automatically`),
  //   Options.withAlias(`o`),
  //   Options.withDefault(true),
  // ),
  // port: Options.integer(`port`).pipe(
  //   Options.withDescription(`Port to start server on (default: 5173)`),
  //   Options.withAlias(`p`),
  //   Options.optional,
  // ),
  schema: Options.text(`schema`).pipe(
    Options.withDescription(`Path to GraphQL schema file`),
    Options.withAlias(`s`),
    Options.withDefault(`./schema.graphql`),
  ),
}

export const devCommand = Command.make(
  `dev`,
  options,
  ({ schema }) =>
    Effect.gen(function*() {
      // const appDirectory = Path.join(rootDirectory, `app`)
      // const publicDirectory = Path.join(rootDirectory, `public`)

      const app = yield* Effect.tryPromise(() =>
        TanStackController.createApp({
          rootDirectory,
        })
      )

      // Patch up Vinxi config.
      // TanStack doesn't configure this or allow one to. Maybe that means this config is useless. Not sure!
      // app.config.name = `Pollen`
      // app.config.root = rootDirectory

      // console.log(app.config)

      yield* Effect.tryPromise(() => app.dev())
    }),
)
