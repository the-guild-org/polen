import { Grafaid } from '#lib/grafaid/index'
import { GraphqlChange } from '#lib/graphql-change/index'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { GraphqlSchemaLoader } from '#lib/graphql-schema-loader/index'
import { Fs, Json, Path } from '@wollybeard/kit'
import type { NonEmptyChangeSets, SchemaReadResult } from '../../schema.js'

/**
 * Configuration for loading schema via GraphQL introspection.
 *
 * Polen supports two introspection features:
 * 1. **File Convention**: Automatically detects `schema.introspection.json` if present
 * 2. **Automatic Introspection**: Fetches from your endpoint and creates the file
 *
 * When configured, Polen will:
 * - Execute the standard GraphQL introspection query against your endpoint
 * - Save the result to `schema.introspection.json` in your project root
 * - Use this cached file for subsequent builds (no network requests)
 *
 * The saved file contains a standard GraphQL introspection query result as defined
 * in the GraphQL specification, making it compatible with any tool that works with
 * introspection data (GraphQL Codegen, Apollo CLI, etc.).
 *
 * To refresh the schema, delete `schema.introspection.json` and rebuild.
 *
 * **Technical details**:
 * - Uses Graffle's introspection extension
 * - Performs the full introspection query (all types, fields, descriptions, etc.)
 * - No customization of the query is currently supported
 *
 * @see https://spec.graphql.org/draft/#sec-Introspection - GraphQL Introspection spec
 * @see https://github.com/graphql/graphql-js/blob/main/src/utilities/getIntrospectionQuery.ts - Reference implementation
 *
 * @example
 * ```ts
 * // Basic introspection
 * introspection: {
 *   url: 'https://api.example.com/graphql'
 * }
 *
 * // With authentication
 * introspection: {
 *   url: 'https://api.example.com/graphql',
 *   headers: {
 *     'Authorization': `Bearer ${process.env.API_TOKEN}`
 *   }
 * }
 * ```
 */
export interface ConfigInput {
  /**
   * The GraphQL endpoint URL to introspect.
   *
   * Must be a valid GraphQL endpoint that supports introspection queries.
   *
   * @example 'https://api.example.com/graphql'
   */
  url?: string
  /**
   * Optional headers to include in the introspection request.
   *
   * Use this for authentication, API keys, or any custom headers
   * required by your GraphQL endpoint.
   *
   * @example
   * ```ts
   * headers: {
   *   'Authorization': `Bearer ${process.env.API_TOKEN}`,
   *   'X-API-Key': process.env.API_KEY
   * }
   * ```
   */
  headers?: Record<string, string>
  projectRoot?: string
}

export interface Config {
  url: string
  headers?: Record<string, string>
  projectRoot: string
}

export const normalizeConfig = (configInput: ConfigInput): Config => {
  if (!configInput.url) {
    throw new Error(`Introspection data source requires a URL`)
  }

  if (!configInput.projectRoot) {
    throw new Error(`Introspection data source requires a projectRoot`)
  }

  const config: Config = {
    url: configInput.url,
    headers: configInput.headers,
    projectRoot: configInput.projectRoot,
  }

  return config
}

const INTROSPECTION_FILE_NAME = `schema.introspection.json`

const getIntrospectionFilePath = (projectRoot: string) => {
  return Path.join(projectRoot, INTROSPECTION_FILE_NAME)
}

export const readOrThrow = async (
  configInput: ConfigInput,
): Promise<SchemaReadResult> => {
  const config = normalizeConfig(configInput)
  const introspectionFilePath = getIntrospectionFilePath(config.projectRoot)

  // Check if introspection file exists
  const introspectionFileContent = await Fs.read(introspectionFilePath)
  let schema: Grafaid.Schema.Schema

  if (introspectionFileContent) {
    // Load from existing file - no reCreate capability
    try {
      const introspectionData = Json.codec.decode(introspectionFileContent)
      schema = Grafaid.Schema.fromIntrospectionQuery(introspectionData as any)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${introspectionFilePath}: ${error.message}`)
      } else {
        throw new Error(
          `Invalid introspection data in ${introspectionFilePath}: ${
            error instanceof Error ? error.message : String(error)
          }. Delete this file to fetch fresh introspection data.`,
        )
      }
    }

    const schemaData = await createSingleSchemaChangeset(schema)
    return {
      data: schemaData,
      source: { type: 'introspectionFile' },
    }
  } else {
    // Fetch via introspection - can reCreate
    const introspectionResult = await GraphqlSchemaLoader.load({
      type: `introspect`,
      url: config.url,
      headers: config.headers,
    })

    schema = introspectionResult

    // Get the raw introspection result for saving
    const introspectionData = Grafaid.Schema.toIntrospectionQuery(schema)

    // Write to file
    await Fs.write({
      path: introspectionFilePath,
      content: Json.codec.encode(introspectionData as any),
    })

    const schemaData = await createSingleSchemaChangeset(schema)
    return {
      data: schemaData,
      source: {
        type: 'introspectionAuto',
        reCreate: async () => {
          // Re-fetch using captured config - capture closure
          const result = await readOrThrow(configInput)
          return result.data
        },
      },
    }
  }
}

/**
 * Create a single changeset from a schema object.
 * This is the core logic for handling single (unversioned) schemas from introspection.
 */
export const createSingleSchemaChangeset = async (schema: Grafaid.Schema.Schema): Promise<NonEmptyChangeSets> => {
  const date = new Date() // Generate date here for unversioned schema
  const after = schema
  const before = Grafaid.Schema.empty
  const changes = await GraphqlChange.calcChangeset({
    before,
    after,
  })

  const changeset: GraphqlChangeset.ChangeSet = {
    date,
    after,
    before,
    changes,
  }

  const result: NonEmptyChangeSets = [changeset]

  return result
}
