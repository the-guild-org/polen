import { Command, Options } from '@effect/cli'
import { Console, Effect, Option } from 'effect'
import * as Vite from 'vite'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

// Create a virtual schema module ID
const VIRTUAL_SCHEMA_ID = 'virtual:pollen-schema'
const RESOLVED_VIRTUAL_SCHEMA_ID = '\0' + VIRTUAL_SCHEMA_ID

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

/**
 * Create a Vite plugin to make the GraphQL schema available to the app
 */
const createSchemaPlugin = (schemaPath: string) => {
  const resolvedSchemaPath = path.resolve(process.cwd(), schemaPath)
  
  return {
    name: 'pollen:schema',
    
    resolveId(id: string) {
      if (id === VIRTUAL_SCHEMA_ID) {
        return RESOLVED_VIRTUAL_SCHEMA_ID
      }
    },
    
    async load(id: string) {
      if (id === RESOLVED_VIRTUAL_SCHEMA_ID) {
        try {
          const schema = await fs.readFile(resolvedSchemaPath, 'utf-8')
          return `export default ${JSON.stringify(schema)}`
        } catch (error) {
          Console.error(`Failed to load schema from ${resolvedSchemaPath}`)
          Console.error(String(error))
          return 'export default ""'
        }
      }
    },
  }
}

export const devCommand = Command.make('dev', options, ({ open, port, schema }) =>
  Effect.gen(function*() {
    try {
      // Log startup information
      yield* Console.log(`Starting Pollen development server...`)
      yield* Console.log(`Using schema file: ${schema}`)
      
      // Create and configure the server
      const server = yield* Effect.tryPromise(() =>
        Vite.createServer({
          plugins: [
            createSchemaPlugin(schema),
          ],
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
