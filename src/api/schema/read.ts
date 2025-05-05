import * as DataSources from './data-sources/data-sources.js'
import { Arr } from '#lib/prelude/prelude.js'
import type { Schema } from './schema.js'

export type DataSourceType = `file` | `directory` | `memory` | `data`

export interface Config {
  /**
   * @defaultValue `true`
   */
  enabled?: boolean
  useDataSources?: Arr.Maybe<DataSourceType>
  dataSources?: {
    file?: DataSources.SchemaFile.ConfigInput,
    directory?: DataSources.SchemaDirectory.ConfigInput,
    memory?: DataSources.Memory.ConfigInput,
    data?: Schema,
  }
  projectRoot: string
}

export const readOrThrow = async (
  config: Config,
): Promise<null | Schema> => {
  if (config.enabled === false) {
    return null
  }

  const useDataSources = config.useDataSources ? Arr.ensure(config.useDataSources) : null
  const usingDataSource = (dataSource: DataSourceType) =>
    useDataSources === null || useDataSources.includes(dataSource)

  let result: null | Schema = null

  if (usingDataSource(`directory`)) {
    const directoryConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources?.directory,
    }
    result = await DataSources.SchemaDirectory.readOrThrow(directoryConfig)
    if (result) return result
  }

  if (usingDataSource(`file`)) {
    const fileConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources?.file,
    }
    result = await DataSources.SchemaFile.readOrThrow(fileConfig)
    if (result) return result
  }

  if (usingDataSource(`memory`) && config.dataSources?.memory) {
    const memoryConfig = {
      projectRoot: config.projectRoot,
      ...config.dataSources.memory,
    }
    result = await DataSources.Memory.read(memoryConfig)
    if (result) return result
  }

  return null
}
