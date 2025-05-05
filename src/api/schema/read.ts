import { type Schema } from './schema.js'
import * as DataSources from './data-sources/data-sources.js'

export const readOrThrow = async (parameters: { projectRoot: string }): Promise<null | Schema> => {
  const result = await DataSources.SchemaDirectory.readOrThrow({
    path: parameters.projectRoot,
  })
  if (result) return result

  const result2 = await DataSources.SchemaFile.readOrThrow({
    path: parameters.projectRoot,
  })
  if (result2) return result2

  return null
}
