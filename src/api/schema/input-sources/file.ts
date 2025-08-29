import { InputSource } from '#api/schema/input-source/$'
import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Grafaid } from '#lib/grafaid'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { PlatformError } from '@effect/platform/Error'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'

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

export const loader = InputSource.createEffect({
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

      const ast = yield* Grafaid.Schema.AST.parse(content).pipe(
        Effect.mapError((error) =>
          InputSource.InputSourceError('file', `Failed to parse schema file: ${error}`, error)
        ),
      )
      const after = yield* Grafaid.Schema.fromAST(ast).pipe(
        Effect.mapError((error) => InputSource.InputSourceError('file', `Failed to build schema: ${error}`, error)),
      )

      const date = new Date()
      const before = Grafaid.Schema.empty
      const changes = yield* Change.calcChangeset({ before, after }).pipe(
        Effect.mapError((error) =>
          InputSource.InputSourceError('file', `Failed to calculate changeset: ${error}`, error)
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
