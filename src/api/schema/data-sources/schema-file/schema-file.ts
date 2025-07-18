import { Grafaid } from '#lib/grafaid'
import { GraphqlChange } from '#lib/graphql-change'
import type { GraphqlChangeset } from '#lib/graphql-changeset'
import { Path } from '@wollybeard/kit'

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
): Promise<null | GraphqlChangeset.ChangelogLinked> => {
  const config = normalizeConfig(configInput)

  const schemaFile = await Grafaid.Schema.read(config.path)
  if (!schemaFile) return null

  return await readSingleSchemaFile(config.path)
}

/**
 * Create a single changeset from a schema file path.
 * This is the core logic for handling single (unversioned) schemas.
 */
export const readSingleSchemaFile = async (filePath: string): Promise<GraphqlChangeset.ChangelogLinked> => {
  const schemaFile = await Grafaid.Schema.read(filePath)
  if (!schemaFile) throw new Error(`Failed to read schema file: ${filePath}`)

  const date = new Date() // Generate date here for unversioned schema
  const after = schemaFile.content
  const before = Grafaid.Schema.empty
  const changes = await GraphqlChange.calcChangeset({
    before,
    after,
  })

  const changeset: GraphqlChangeset.IntermediateChangeSetLinked = {
    type: 'IntermediateChangeSet',
    date,
    after: { version: null, data: after },
    before: { version: null, data: before },
    changes,
  }

  const schema: GraphqlChangeset.ChangelogLinked = [changeset]

  return schema
}
