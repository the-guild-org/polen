import { InputSource } from '#api/schema/input-source/$'
import { InputSourceError } from '#api/schema/input-source/$$'
import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Grafaid } from '#lib/grafaid'
import { Revision } from '#lib/revision/$'
import { SchemaDefinition } from '#lib/schema-definition/$'
import { Schema } from '#lib/schema/$'
import { debugPolen } from '#singletons/debug'
import { PlatformError } from '@effect/platform/Error'
import { FileSystem } from '@effect/platform/FileSystem'
import { Arr, Path } from '@wollybeard/kit'
import { Effect } from 'effect'

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
export interface Options {
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
}

export interface Config {
  path: string
}

export const normalizeOptions = (options: Options, projectRoot: string): Config => {
  const config: Config = {
    path: options.path
      ? Path.ensureAbsolute(options.path, projectRoot)
      : Path.join(projectRoot, defaultPaths.schemaDirectory),
  }

  return config
}

export const loader = InputSource.createEffect({
  name: 'directory',
  isApplicable: (options: Options, context) =>
    Effect.gen(function*() {
      const config = normalizeOptions(options, context.paths.project.rootDir)

      // Check if directory exists
      const fs = yield* FileSystem
      const dirStatsResult = yield* Effect.either(fs.stat(config.path))
      if (dirStatsResult._tag === 'Left') {
        return false
      }

      const dirStats = dirStatsResult.right
      if (dirStats.type !== 'Directory') {
        return false
      }

      // Get all files in directory
      const files = yield* fs.readDirectory(config.path)

      // Check if we have any .graphql files with valid date names
      const hasValidFiles = files.some(file => {
        if (!file.endsWith('.graphql')) return false
        const name = Path.basename(file, '.graphql')
        return /^\d{4}-\d{2}-\d{2}$/.test(name)
      })

      return hasValidFiles
    }),
  readIfApplicableOrThrow: (options: Options, context) =>
    Effect.gen(function*() {
      const config = normalizeOptions(options, context.paths.project.rootDir)

      debug(`will search`, config)

      // Get all files in directory
      const filesResult = yield* Effect.either(fs.readDirectory(config.path))
      if (filesResult._tag === 'Left') {
        debug(`error searching directory:`, filesResult.left)
        return null
      }

      const files = filesResult.right
      const graphqlFiles = files.filter(file => file.endsWith('.graphql'))

      if (!Arr.isntEmpty(graphqlFiles)) {
        return null
      }

      const filePaths = graphqlFiles.map(file => Path.join(config.path, file))
      debug(`did find`, filePaths)

      const revisionInputs = Arr.map(filePaths, (filePath) => {
        const name = Path.basename(filePath, '.graphql')
        // Validate date format YYYY-MM-DD
        const dateMatch = name.match(/^\d{4}-\d{2}-\d{2}$/)
        if (!dateMatch) return null
        return {
          date: name,
          filePath,
        }
      }).filter((x): x is NonNullable<typeof x> => x !== null)

      if (!Arr.isntEmpty(revisionInputs)) {
        return null
      }

      debug(`parsed revision inputs`, revisionInputs)

      // Load and process all revisions
      const schema = yield* read(revisionInputs)

      return Catalog.Unversioned.make({
        schema,
      })
    }),
})

const read = (
  revisionInputs: { date: string; filePath: string }[],
): Effect.Effect<Schema.Unversioned.Unversioned, InputSourceError, FileSystem> =>
  Effect.gen(function*() {
    const revisionInputsLoaded = yield* Effect.all(
      Arr.map(revisionInputs, (revisionInput) =>
        Effect.gen(function*() {
          const fs = yield* FileSystem
          const content = yield* fs.readFileString(revisionInput.filePath)
          const ast = yield* Grafaid.Schema.AST.parse(content).pipe(
            Effect.mapError((error) =>
              InputSourceError('directory', `Failed to parse schema file ${revisionInput.filePath}: ${error}`, error)
            ),
          )
          const schema = yield* Grafaid.Schema.fromAST(ast).pipe(
            Effect.mapError((error) =>
              InputSourceError('directory', `Failed to build schema from ${revisionInput.filePath}: ${error}`, error)
            ),
          )

          return {
            ...revisionInput,
            schema,
          }
        })),
      { concurrency: 'unbounded' },
    )
    debug(`read revisions`)

    // Sort by date ascending (oldest first)
    revisionInputsLoaded.sort((a, b) => a.date.localeCompare(b.date))

    const revisions = yield* Effect.all(
      Arr.map(revisionInputsLoaded, (item, index) =>
        Effect.gen(function*() {
          const current = item
          const previous = revisionInputsLoaded[index - 1]

          const before = previous?.schema ?? Grafaid.Schema.empty
          const after = current.schema

          const changes = yield* Change.calcChangeset({ before, after }).pipe(
            Effect.mapError((error) => InputSourceError('directory', `Failed to calculate changeset: ${error}`, error)),
          )

          return Revision.make({
            date: DateOnly.make(current.date),
            changes,
          })
        })),
      { concurrency: 1 }, // Keep sequential for correct changeset calculation
    )

    // Get the latest schema (last in the array after sorting)
    const latestSchemaData = revisionInputsLoaded[revisionInputsLoaded.length - 1]?.schema
    if (!latestSchemaData) {
      return yield* Effect.fail(InputSourceError('directory', 'No schema files found'))
    }

    // Create unversioned schema with full revisions
    const schema = Schema.Unversioned.make({
      revisions: revisions.slice().reverse(), // Back to chronological order
      definition: latestSchemaData, // GraphQLSchema object
    })

    debug(`computed revisions`)
    return schema
  })
