import { Grafaid } from '#lib/grafaid/index'
import { GraphqlChange } from '#lib/graphql-change/index'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { Path } from '@wollybeard/kit'
import type { NonEmptyChangeSets } from '../../schema.js'

const defaultPaths = {
  schemaFile: `./schema.graphql`,
}

/**
 * Configuration for loading schema from a single SDL file.
 */
export interface ConfigInput {
  /**
   * Path to the GraphQL SDL file.
   *
   * Can be absolute or relative to the project root.
   *
   * @default './schema.graphql'
   *
   * @example
   * ```ts
   * // Default location
   * path: './schema.graphql'
   *
   * // Custom location
   * path: './src/graphql/schema.sdl'
   * ```
   */
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
): Promise<null | NonEmptyChangeSets> => {
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

  const schema: NonEmptyChangeSets = [schemaVersion]

  return schema
}
