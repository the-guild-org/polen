import { InputSource } from '#api/schema/input-source/$'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import { Catalog, Change, DateOnly, Grafaid, Revision, Schema } from 'graphql-kit'

const defaultPaths = {
  schemaFile: `./schema.graphql`,
}

/**
 * Configuration for loading schema from a single SDL file.
 */
export interface Options {
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
}

export interface Config {
  path: string
}

export const normalizeConfig = (options: Options, projectRoot: string): Config => {
  const config: Config = {
    path: options.path
      ? Path.ensureAbsolute(options.path, projectRoot)
      : Path.join(projectRoot, defaultPaths.schemaFile),
  }

  return config
}

export const loader = InputSource.create({
  name: 'file',
  isApplicable: (options: Options, context) =>
    Effect.gen(function*() {
      const config = normalizeConfig(options, context.paths.project.rootDir)

      // Check if file exists and is a .graphql file
      const fs = yield* FileSystem
      const result = yield* Effect.either(fs.stat(config.path))
      if (result._tag === 'Left') {
        return false
      }

      const stats = result.right
      return stats.type === 'File' && config.path.endsWith('.graphql')
    }),
  readIfApplicableOrThrow: (options: Options, context) =>
    Effect.gen(function*() {
      const config = normalizeConfig(options, context.paths.project.rootDir)

      const fs = yield* FileSystem
      const content = yield* fs.readFileString(config.path)

      const ast = yield* Grafaid.Parse.parseSchema(content, { source: config.path }).pipe(
        Effect.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'file',
            message: error.message,
            cause: error,
          })
        ),
      )
      const after = yield* Grafaid.Schema.fromAST(ast).pipe(
        Effect.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'file',
            message: error.message,
            cause: error,
          })
        ),
      )

      const date = new Date()
      const before = Grafaid.Schema.empty
      const changes = yield* Change.calcChangeset({ before, after }).pipe(
        Effect.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'file',
            message: `Failed to calculate changeset: ${error}`,
            cause: error,
          })
        ),
      )

      // Create the date string for revision
      const dateString = date.toISOString().split('T')[0]!

      const revision = Revision.make({
        date: DateOnly.make(dateString),
        changes,
      })

      // Create the unversioned schema with full revision
      const schema = Schema.Unversioned.make({
        revisions: [revision],
        definition: after, // GraphQLSchema object
      })

      // Return the unversioned catalog
      return Catalog.Unversioned.make({
        schema,
      })
    }),
})
