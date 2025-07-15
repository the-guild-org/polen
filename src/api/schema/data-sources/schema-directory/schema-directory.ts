import { Grafaid } from '#lib/grafaid/index'
import { GraphqlChange } from '#lib/graphql-change/index'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { debugPolen } from '#singletons/debug'
import { Arr, Path } from '@wollybeard/kit'
import { glob } from 'tinyglobby'
import type { NonEmptyChangeSets } from '../../schema.js'
import { FileNameExpression } from './file-name-expression/index.js'

// const debug = debugPolen.sub([`schema`, `data-source-schema-directory`])
const debug = debugPolen.sub(`schema:data-source-schema-directory`)

const defaultPaths = {
  schemaDirectory: `./schema`,
}

/**
 * Configuration for loading multiple schema versions from a directory.
 *
 * Enables the schema changelog feature by loading SDL files with date prefixes.
 */
export interface ConfigInput {
  /**
   * Path to the directory containing dated SDL files.
   *
   * Files should be named with ISO date prefixes: `YYYY-MM-DD.graphql`
   *
   * @default './schema'
   *
   * @example
   * ```ts
   * // Default location
   * path: './schema'
   *
   * // Custom location
   * path: './graphql/versions'
   * ```
   *
   * Directory structure example:
   * ```
   * schema/
   *   2024-01-15.graphql
   *   2024-03-20.graphql
   *   2024-06-10.graphql
   * ```
   */
  path?: string
  projectRoot?: string
}

export interface Config {
  path: string
}

export const normalizeConfig = (configInput: ConfigInput): Config => {
  const ensureAbsolute = Path.ensureAbsoluteWith(configInput.projectRoot)
  const config: Config = {
    path: ensureAbsolute(configInput.path ?? defaultPaths.schemaDirectory),
  }

  return config
}

export const readOrThrow = async (configInput: ConfigInput): Promise<null | NonEmptyChangeSets> => {
  const config = normalizeConfig(configInput)

  debug(`will search`, config)
  const filePaths = await glob({
    cwd: config.path,
    absolute: true,
    onlyFiles: true,
    patterns: [`*.graphql`],
  })
  debug(`did find`, filePaths)

  if (!Arr.isntEmpty(filePaths)) {
    return null
  }

  const fileNameExpressions = Arr.map(filePaths, FileNameExpression.parseOrThrow)
  debug(`parsed file names`, fileNameExpressions)

  const versions = await Promise.all(Arr.map(fileNameExpressions, async fileNameExpression => {
    const schemaFile = await Grafaid.Schema.read(fileNameExpression.filePath)
    // Should never happen since these paths come from the glob.
    if (!schemaFile) throw new Error(`Failed to read schema file: ${fileNameExpression.filePath}`)

    return {
      ...fileNameExpression,
      schema: schemaFile.content,
    }
  }))
  debug(`read schemas`)

  versions.sort((a, b) => a.date.getTime() - b.date.getTime())

  const changesets = await Promise.all(
    Arr.map(versions, async (version, index): Promise<GraphqlChangeset.ChangeSet> => {
      const current = version
      const previous = versions[index - 1]

      const before = previous?.schema ?? Grafaid.Schema.empty
      const after = current.schema

      const changes = await GraphqlChange.calcChangeset({
        before,
        after,
      })

      return {
        date: current.date,
        before,
        after,
        changes,
      }
    }),
  )

  changesets.reverse()

  const schema: NonEmptyChangeSets = changesets

  debug(`computed schema`)

  return schema
}
