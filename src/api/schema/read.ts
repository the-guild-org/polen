import { Arr } from '@wollybeard/kit'
import * as DataSources from './data-sources/data-sources.js'
import type { Schema } from './schema.js'

export type DataSourceType = `file` | `directory` | `memory` | `data`

/**
 * Schema configuration for Polen.
 */
export interface Config {
  /**
   * Whether to enable schema loading.
   *
   * Set to `false` to disable schema features entirely.
   *
   * @default `true`
   */
  enabled?: boolean
  /**
   * Which data sources to use for loading schemas.
   *
   * - `file` - Load from a single SDL file
   * - `directory` - Load multiple SDL files from a directory
   * - `memory` - Use schemas defined in configuration
   * - `data` - Use a pre-built schema object
   *
   * If not specified, Polen will try all sources in order until one succeeds.
   *
   * @example
   * ```ts
   * // Use only file source
   * useDataSources: 'file'
   *
   * // Try multiple sources
   * useDataSources: ['directory', 'file']
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
    data?: Schema
  }
  projectRoot: string
}

export const readOrThrow = async (
  config: Config,
): Promise<null | Schema> => {
  if (config.enabled === false) {
    return null
  }

  const useDataSources = config.useDataSources ? Arr.sure(config.useDataSources) : null
  const usingDataSource = (dataSource: DataSourceType) => useDataSources === null || useDataSources.includes(dataSource)

  if (usingDataSource(`data`) && config.dataSources?.data) {
    return config.dataSources.data
  }

  if (usingDataSource(`directory`)) {
    const directoryConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources?.directory,
    }
    const result = await DataSources.SchemaDirectory.readOrThrow(directoryConfig)
    if (result) return result
  }

  if (usingDataSource(`file`)) {
    const fileConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources?.file,
    }
    const result = await DataSources.SchemaFile.readOrThrow(fileConfig)
    if (result) return result
  }

  if (usingDataSource(`memory`) && config.dataSources?.memory) {
    const memoryConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources.memory,
    }
    const result = await DataSources.Memory.read(memoryConfig)
    if (result) return result
  }

  return null
}
