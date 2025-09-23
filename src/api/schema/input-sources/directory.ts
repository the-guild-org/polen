import { InputSource } from '#api/schema/input-source/$'
import { InputSourceError } from '#api/schema/input-source/errors'
import { mapToInputSourceError, normalizePathToAbs } from '#api/schema/input-source/helpers'
import { Ar, Ef } from '#dep/effect'
import { debugPolen } from '#singletons/debug'
import type { FileSystem } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import { Fs, FsLoc } from '@wollybeard/kit'
import { Order } from 'effect'
import { Catalog, Change, DateOnly, Grafaid, Revision, Schema } from 'graphql-kit'

// const debug = debugPolen.sub([`schema`, `data-source-schema-directory`])
const debug = debugPolen.sub(`schema:data-source-schema-directory`)

const l = FsLoc.fromString

const defaultPaths = {
  schemaDirectory: l(`./schema`),
} as const

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
  path?: string | FsLoc.AbsDir.AbsDir | FsLoc.RelDir.RelDir
}

export interface Config {
  path: FsLoc.AbsDir.AbsDir
}

export const normalizeOptions = (options: Options, projectRoot: FsLoc.AbsDir.AbsDir): Config => {
  const config: Config = {
    path: normalizePathToAbs.dir(options.path, projectRoot, defaultPaths.schemaDirectory),
  }

  return config
}

export const loader = InputSource.create({
  name: 'directory',
  isApplicable: (options: Options, context) =>
    Ef.gen(function*() {
      const config = normalizeOptions(options, context.paths.project.rootDir)

      // Check if directory exists
      const dirStatsResult = yield* Ef.either(Fs.stat(config.path))
      if (dirStatsResult._tag === 'Left') {
        return false
      }

      const dirStats = dirStatsResult.right
      if (dirStats.type !== 'Directory') {
        return false
      }

      // Get all files in directory
      const files = yield* Fs.read(config.path)

      // Check if we have either:
      // 1. A single schema.graphql file (non-versioned mode)
      // 2. Any .graphql files with valid date names (versioned mode)
      const hasSchemaFile = Ar.some(files, entry => {
        if (entry._tag !== 'LocAbsFile') return false
        return FsLoc.name(entry) === 'schema.graphql'
      })
      const hasVersionedFiles = Ar.some(files, entry => {
        if (entry._tag !== 'LocAbsFile') return false
        const fileName = FsLoc.name(entry)
        if (!fileName.endsWith('.graphql')) return false
        const name = fileName.replace('.graphql', '')
        return /^\d{4}-\d{2}-\d{2}$/.test(name)
      })

      return hasSchemaFile || hasVersionedFiles
    }),
  readIfApplicableOrThrow: (options: Options, context) =>
    Ef.gen(function*() {
      const config = normalizeOptions(options, context.paths.project.rootDir)

      debug(`will search`, config)

      // Get all files in directory
      const filesResult = yield* Ef.either(Fs.read(config.path))
      if (filesResult._tag === 'Left') {
        debug(`error searching directory:`, filesResult.left)
        return null
      }

      const files = filesResult.right
      const graphqlFiles = files.filter((entry) => {
        if (entry._tag !== 'LocAbsFile') return false
        return FsLoc.name(entry).endsWith('.graphql')
      }) as FsLoc.AbsFile.AbsFile[]

      if (!Ar.isNonEmptyArray(graphqlFiles)) {
        return null
      }

      debug(`did find`, graphqlFiles)

      // Check for single schema.graphql file (non-versioned mode)
      const singleSchemaPath = graphqlFiles.find(p => FsLoc.name(p) === 'schema.graphql')
      if (singleSchemaPath) {
        // Use today's date for single schema file
        const today = DateOnly.fromDate(new Date())
        const revisionInputs = [{
          date: today,
          filePath: singleSchemaPath,
        }]
        debug(`using single schema.graphql as non-versioned schema`)
        const schema = yield* read(revisionInputs)
        return Catalog.Unversioned.make({
          schema,
        })
      }

      // Otherwise, look for versioned files with date prefixes
      const revisionInputs = Ar.map(graphqlFiles, (filePath) => {
        const fileName = FsLoc.name(filePath)
        const name = fileName.replace('.graphql', '')
        // Validate date format YYYY-MM-DD
        const dateMatch = name.match(/^\d{4}-\d{2}-\d{2}$/)
        if (!dateMatch) return null
        return {
          date: DateOnly.make(name),
          filePath,
        }
      }).filter((x): x is NonNullable<typeof x> => x !== null)

      if (!Ar.isNonEmptyArray(revisionInputs)) {
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
  revisionInputs: { date: DateOnly.DateOnly; filePath: FsLoc.AbsFile.AbsFile }[],
): Ef.Effect<Schema.Unversioned.Unversioned, InputSourceError | PlatformError, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const revisionInputsLoaded = yield* Ef.all(
      Ar.map(revisionInputs, (revisionInput) =>
        Ef.gen(function*() {
          const content = yield* Fs.readString(revisionInput.filePath)
          const ast = yield* Grafaid.Parse.parseSchema(content, { source: FsLoc.encodeSync(revisionInput.filePath) })
            .pipe(
              Ef.mapError(mapToInputSourceError('directory')),
            )
          const schema = yield* Grafaid.Schema.fromAST(ast).pipe(
            Ef.mapError(mapToInputSourceError('directory')),
          )

          return {
            ...revisionInput,
            schema,
          }
        })),
      { concurrency: 'unbounded' },
    )
    debug(`read revisions`)

    // Sort by date descending (newest first for consistent catalog structure)
    const revisionInputsSorted = Ar.sort(
      revisionInputsLoaded,
      Order.mapInput(DateOnly.order, (item: typeof revisionInputsLoaded[0]) => item.date),
    )

    const revisions = yield* Ef.all(
      Ar.map(revisionInputsSorted, (item, index) =>
        Ef.gen(function*() {
          const current = item
          const previous = revisionInputsSorted[index - 1]

          const before = previous?.schema ?? Grafaid.Schema.empty
          const after = current.schema

          const changes = yield* Change.calcChangeset({ before, after }).pipe(
            Ef.mapError(mapToInputSourceError('directory')),
          )

          return Revision.make({
            date: current.date,
            changes,
          })
        })),
      { concurrency: 1 }, // Keep sequential for correct changeset calculation
    )

    // Get the latest schema (first in the array after sorting newest first)
    const latestSchemaData = revisionInputsSorted[0]?.schema
    if (!latestSchemaData) {
      return yield* Ef.fail(new InputSourceError({ source: 'directory', message: 'No schema files found' }))
    }

    // Create unversioned schema with full revisions
    const schema = Schema.Unversioned.make({
      revisions: revisions, // Already sorted newest first
      definition: latestSchemaData, // GraphQLSchema object
    })

    debug(`computed revisions`)
    return schema
  })
