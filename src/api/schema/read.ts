import { Arr, Fs, Path } from '@wollybeard/kit'
import * as DataSources from './data-sources/data-sources.js'
import type { NonEmptyChangeSets } from './schema.js'

export type DataSourceType = `file` | `directory` | `memory` | `data` | `introspection` | `introspectionFile` | `introspectionAuto`

/**
 * Result of schema reading with provenance tracking for file watching and debugging.
 */
export interface SchemaReadResult {
  data: NonEmptyChangeSets | null
  source: {
    type: DataSourceType
    /**
     * Recreate the schema data and file after it has been deleted.
     * 
     * This function re-fetches data from the original source and recreates
     * the schema file on disk. Only called by file watchers after deletion.
     * 
     * @returns Promise resolving to the recreated schema data, or null if recreation fails
     */
    reCreate?: () => Promise<NonEmptyChangeSets | null>
  }
}

/**
 * Schema configuration for Polen.
 *
 * Polen supports multiple ways to load your GraphQL schema, from simple files
 * to dynamic introspection. Configure which sources to use and in what order.
 *
 * @example
 * ```ts
 * // Load from a file (default)
 * schema: {} // Looks for schema.graphql
 *
 * // Load via introspection
 * schema: {
 *   dataSources: {
 *     introspection: {
 *       url: 'https://api.example.com/graphql',
 *       headers: { 'Authorization': 'Bearer token' }
 *     }
 *   }
 * }
 *
 * // Try multiple sources in order
 * schema: {
 *   useDataSources: ['introspection', 'file'],
 *   dataSources: {
 *     introspection: { url: 'https://api.example.com/graphql' },
 *     file: { path: './fallback-schema.graphql' }
 *   }
 * }
 * ```
 */
export interface Config {
  /**
   * Whether to enable schema loading.
   *
   * Set to `false` to disable schema features entirely. This removes
   * the Reference and Changelog pages from your portal.
   *
   * @default true
   *
   * @example
   * ```ts
   * // Disable schema features
   * schema: { enabled: false }
   * ```
   */
  enabled?: boolean
  /**
   * Which data sources to use for loading schemas.
   *
   * - `file` - Load from a single SDL file (default: `./schema.graphql`)
   * - `directory` - Load multiple SDL files from a directory (default: `./schema/`)
   * - `memory` - Use schemas defined in configuration
   * - `data` - Use a pre-built schema object
   * - `introspection` - Load schema via GraphQL introspection
   *
   * If not specified, Polen tries all sources in this order:
   * 1. `data` 2. `directory` 3. `file` 4. `memory` 5. `introspection`
   *
   * @example
   * ```ts
   * // Use only file source
   * useDataSources: 'file'
   *
   * // Try multiple sources in custom order
   * useDataSources: ['introspection', 'file']
   *
   * // Default behavior (try all sources)
   * // useDataSources: undefined
   * ```
   */
  useDataSources?: Arr.Maybe<DataSourceType>
  /**
   * Configuration for each data source type.
   */
  dataSources?: {
    /**
     * Configuration for loading schema from a single SDL file.
     */
    file?: DataSources.SchemaFile.ConfigInput
    /**
     * Configuration for loading multiple schema versions from a directory.
     */
    directory?: DataSources.SchemaDirectory.ConfigInput
    /**
     * Configuration for defining schemas programmatically.
     */
    memory?: DataSources.Memory.ConfigInput
    /**
     * Pre-built schema object to use directly.
     */
    data?: NonEmptyChangeSets
    /**
     * Configuration for loading schema via GraphQL introspection.
     *
     * Introspection fetches your schema directly from a running GraphQL endpoint.
     * The schema is saved to `schema.introspection.json` in your project root.
     * Delete this file to force a fresh introspection on the next build.
     *
     * @example
     * ```ts
     * introspection: {
     *   url: 'https://api.example.com/graphql',
     *   headers: { 'Authorization': 'Bearer token' }
     * }
     * ```
     */
    introspection?: DataSources.Introspection.ConfigInput
  }
  projectRoot: string
}

export const readOrThrow = async (
  config: Config,
): Promise<SchemaReadResult> => {
  if (config.enabled === false) {
    return { data: null, source: { type: 'data' } }
  }

  const useDataSources = config.useDataSources ? Arr.sure(config.useDataSources) : null
  const usingDataSource = (dataSource: DataSourceType) => useDataSources === null || useDataSources.includes(dataSource)

  if (usingDataSource(`data`) && config.dataSources?.data) {
    return { data: config.dataSources.data, source: { type: 'data' } }
  }

  if (usingDataSource(`directory`)) {
    const directoryConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources?.directory,
    }
    const result = await DataSources.SchemaDirectory.readOrThrow(directoryConfig)
    if (result) return { data: result, source: { type: 'directory' } }
  }

  if (usingDataSource(`file`)) {
    const fileConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources?.file,
    }
    const result = await DataSources.SchemaFile.readOrThrow(fileConfig)
    if (result) return { data: result, source: { type: 'file' } }
  }

  if (usingDataSource(`memory`) && config.dataSources?.memory) {
    const memoryConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources.memory,
    }
    const result = await DataSources.Memory.read(memoryConfig)
    if (result) return { data: result, source: { type: 'memory' } }
  }

  if (usingDataSource(`introspection`) && config.dataSources?.introspection) {
    const introspectionConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources.introspection,
    }
    const result = await DataSources.Introspection.readOrThrow(introspectionConfig)
    if (result.data) return result
  }

  return { data: null, source: { type: 'data' } }
}
