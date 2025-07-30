import { InputSource } from '#api/schema/input-source/$'
import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Grafaid } from '#lib/grafaid'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { Path } from '@wollybeard/kit'

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
  readIfApplicableOrThrow: async (options: Options, context) => {
    const config = normalizeConfig(options, context.paths.project.rootDir)

    const schemaFile = await Grafaid.Schema.read(config.path)
    if (!schemaFile) return null

    const date = new Date()
    const after = schemaFile.content
    const before = Grafaid.Schema.empty
    const changes = await Change.calcChangeset({
      before,
      after,
    })

    // Create the date string for revision
    const dateString = date.toISOString().split('T')[0]!

    const revision = Revision.make({
      _tag: 'Revision',
      date: DateOnly.make(dateString),
      changes,
    })

    // Create the unversioned schema with full revision
    const schema = Schema.Unversioned.make({
      _tag: 'SchemaUnversioned',
      revisions: [revision],
      definition: after, // GraphQLSchema object
    })

    // Return the unversioned catalog
    return Catalog.Unversioned.make({
      _tag: 'CatalogUnversioned',
      schema,
      revisions: [revision],
    })
  },
})
