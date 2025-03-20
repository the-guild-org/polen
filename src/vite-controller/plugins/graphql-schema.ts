import type { Plugin } from 'vite'
import * as fs from 'node:fs/promises'
import { Console } from 'effect'
import { Path } from '../../lib/path/_namespace.js'

// Virtual module identifiers
const VIRTUAL_SCHEMA_ID = 'virtual:pollen-schema'
const RESOLVED_VIRTUAL_SCHEMA_ID = '\0' + VIRTUAL_SCHEMA_ID

/**
 * Interface for the GraphQL Schema plugin options
 */
export interface GraphQLSchemaOptions {
  /**
   * Path to the GraphQL schema file
   * Can be relative to the current working directory
   */
  schemaPath: string
}

/**
 * Create a Vite plugin that makes a GraphQL schema available to the application
 * as a virtual module that can be imported with:
 *
 * ```ts
 * import schema from 'virtual:pollen-schema'
 * ```
 */
export const GraphQLSchema = (options: GraphQLSchemaOptions): Plugin => {
  const { schemaPath } = options
  const resolvedSchemaPath = Path.absolutify(schemaPath)

  return {
    name: 'pollen:graphql-schema',

    resolveId(id: string): string | undefined {
      if (id === VIRTUAL_SCHEMA_ID) {
        return RESOLVED_VIRTUAL_SCHEMA_ID
      }
      return undefined
    },

    async load(id: string): Promise<string | undefined> {
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
      return undefined
    },
  }
}
