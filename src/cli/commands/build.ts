import { Command, Options } from '@effect/cli'
import { Console, Effect } from 'effect'
import { TanStackController } from '../../lib/tan-stack-controller/_namespace.js'
import Path from 'path'

const rootDirectory = Path.join(import.meta.dirname, `../../project`)

const options = {
  schema: Options.text(`schema`).pipe(
    Options.withDescription(`Path to GraphQL schema file`),
    Options.withAlias(`s`),
    Options.withDefault(`./schema.graphql`),
  ),
  outDir: Options.text(`outDir`).pipe(
    Options.withDescription(`Output directory for build artifacts`),
    Options.withAlias(`o`),
    Options.withDefault(`./dist`),
  ),
  minify: Options.boolean(`minify`).pipe(
    Options.withDescription(`Enable/disable minification`),
    Options.withAlias(`m`),
    Options.withDefault(true),
  ),
}

export const buildCommand = Command.make(
  `build`,
  options,
  ({ schema, outDir, minify }) =>
    Effect.gen(function*() {
      try {
        // Log build information
        yield* Console.log(`Building Pollen application...`)
        yield* Console.log(`Using schema file: ${schema}`)
        yield* Console.log(`Output directory: ${outDir}`)
        yield* Console.log(`Minification: ${minify ? `enabled` : `disabled`}`)

        const app = yield* Effect.tryPromise(() =>
          TanStackController.createApp({
            rootDirectory,
          })
        )
        yield* Effect.tryPromise(() => app.build())

        yield* Console.log(`Build completed successfully! Output saved to ${outDir}`)

        return
      } catch (error) {
        // Error handling
        yield* Console.error(`Failed to build application:`)
        yield* Console.error(String(error))
        return yield* Effect.fail(error)
      }
    }),
)
