import { Command, Options } from '@effect/cli'
import { Effect } from 'effect'
import { defineConfig } from '@tanstack/react-start/config'
import tsConfigPaths from 'vite-tsconfig-paths'
import * as Path from 'node:path'

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
      const rootDirectory = Path.join(import.meta.dirname, `../../project`)
      const appDirectory = Path.join(rootDirectory, `app`)
      const publicDirectory = Path.join(rootDirectory, `public`)

      const app = yield* Effect.tryPromise(() =>
        defineConfig({
          tsr: {
            appDirectory,
          },
          routers: {
            public: {
              dir: publicDirectory,
            },
          },
          vite: {
            plugins: [
              tsConfigPaths({
                projects: [`./tsconfig.json`],
              }),
            ],
          },
        })
      )

      // Patch up Vinxi config.
      // TanStack doesn't configure this or allow one to. Maybe that means this config is useless. Not sure!
      app.config.name = `Pollen`
      // app.config.root = rootDirectory

      // console.log(app.config)

      yield* Effect.tryPromise(() => app.dev())
    }),
)
