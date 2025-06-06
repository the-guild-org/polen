import { Grafaid } from '#lib/grafaid/index.ts'
import { GraphqlChange } from '#lib/graphql-change/index.ts'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index.ts'
import { Path } from '@wollybeard/kit'
import type { Schema } from '../../schema.ts'

const defaultPaths = {
  schemaFile: `./schema.graphql`,
}

export interface ConfigInput {
  path?: string
  projectRoot?: string
}

export interface Config {
  path: string
}

export const normalizeConfig = (configInput: ConfigInput): Config => {
  const config: Config = {
    path: Path.ensureAbsolute(configInput.path ?? defaultPaths.schemaFile, configInput.projectRoot),
  }

  return config
}

export const readOrThrow = async (
  configInput: ConfigInput,
): Promise<null | Schema> => {
  const config = normalizeConfig(configInput)

  const schemaFile = await Grafaid.Schema.read(config.path)
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
