import { Grafaid } from '#lib/grafaid/index'
import { GraphqlChange } from '#lib/graphql-change/index'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { debugPolen } from '#singletons/debug'
import { Arr, Path } from '@wollybeard/kit'
import { glob } from 'tinyglobby'
import type { NonEmptyChangeSets } from '../../schema.js'
import { readSingleSchemaFile } from '../schema-file/schema-file.js'
import { FileNameExpression } from './file-name-expression/index.js'

// const debug = debugPolen.sub([`schema`, `data-source-schema-directory`])
const debug = debugPolen.sub(`schema:data-source-schema-directory`)

const defaultPaths = {
  schemaDirectory: `./schema`,
}

/**
 * Configuration for loading schema(s) from a directory.
 *
 * Supports two modes:
 * 1. Multiple versioned schemas with date prefixes (enables changelog feature)
 * 2. Single schema file named 'schema.graphql' (non-versioned, like file data source)
 */
export interface ConfigInput {
  /**
   * Path to the directory containing schema files.
   *
   * Supports two patterns:
   * 1. Multiple versioned files with ISO date prefixes: `YYYY-MM-DD.graphql`
   * 2. Single file named: `schema.graphql`
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
   * Directory structure examples:
   * ```
   * // Versioned schemas (enables changelog)
   * schema/
   *   2024-01-15.graphql
   *   2024-03-20.graphql
   *   2024-06-10.graphql
   *
   * // Single schema (non-versioned)
   * schema/
   *   schema.graphql
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

  // Separate versioned (dated) and single schema files
  const versionedExpressions = fileNameExpressions.filter(
    (expr): expr is FileNameExpression.ExpressionVersioned => expr.type === `FileNameExpressionVersioned`,
  )
  const singleExpressions = fileNameExpressions.filter(
    (expr): expr is FileNameExpression.ExpressionSingle => expr.type === `FileNameExpressionSingle`,
  )

  // If we have versioned files, use them (versioned takes precedence)
  if (Arr.isntEmpty(versionedExpressions)) {
    return await readVersionedSchemas(versionedExpressions)
  }

  // If we have a single schema file, use it
  if (Arr.isntEmpty(singleExpressions)) {
    if (singleExpressions.length > 1) {
      throw new Error(
        `Multiple single schema files found, expected exactly one: ${
          singleExpressions.map(e => e.filePath).join(', ')
        }`,
      )
    }
    return await readSingleSchemaFile(singleExpressions[0].filePath)
  }

  // Should not happen since we already checked for empty filePaths
  throw new Error(`No schema files found despite non-empty file paths`)
}

/**
 * Read multiple versioned schema files and create changesets
 */
const readVersionedSchemas = async (
  versionedExpressions: FileNameExpression.ExpressionVersioned[],
): Promise<NonEmptyChangeSets> => {
  const versions = await Promise.all(Arr.map(versionedExpressions, async fileNameExpression => {
    const schemaFile = await Grafaid.Schema.read(fileNameExpression.filePath)
    // Should never happen since these paths come from the glob.
    if (!schemaFile) throw new Error(`Failed to read schema file: ${fileNameExpression.filePath}`)

    return {
      ...fileNameExpression,
      schema: schemaFile.content,
    }
  }))
  debug(`read versioned schemas`)

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

  debug(`computed versioned schema`)
  return changesets as NonEmptyChangeSets
}
