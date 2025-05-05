import { Path } from '#dep/path/index.js'
import { Grafaid } from '#lib/grafaid/index.js'
import { GraphqlChange } from '#lib/graphql-change/index.js'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index.js'
import type { Schema } from '../../schema.js'

const paths = {
  schemaFile: `./schema.graphql`,
}

export const readOrThrow = async (
  parameters: { path: string },
): Promise<null | Schema> => {
  const filePath = Path.join(parameters.path, paths.schemaFile)

  const schemaFile = await Grafaid.Schema.read(filePath)
  if (!schemaFile) return null

  const date = new Date()
  const after = schemaFile.content
  const before = Grafaid.Schema.empty
  const changes = await GraphqlChange.calcChangeset({
    before,
    after,
  })

  const schemaVersion: GraphqlChangeset.ChangeSet = {
    date,
    after,
    before,
    changes,
  }

  const schema: Schema = {
    versions: [schemaVersion],
  }

  return schema
}
