import { InputSource } from '#api/schema/input-source/$'
import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Grafaid } from '#lib/grafaid'
import { Revision } from '#lib/revision/$'
import { SchemaDefinition } from '#lib/schema-definition/$'
import { Schema } from '#lib/schema/$'
import { debugPolen } from '#singletons/debug'
import { Arr, Path } from '@wollybeard/kit'
import { glob } from 'tinyglobby'

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

export const loader = InputSource.create({
  name: 'directory',
  readIfApplicableOrThrow: async (options: Options, context) => {
    const config = normalizeOptions(options, context.paths.project.rootDir)

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
    const { schema, revisions } = await read(revisionInputs)

    return Catalog.Unversioned.make({
      _tag: 'CatalogUnversioned',
      schema,
      revisions,
    })
  },
})

const read = async (
  revisionInputs: { date: string; filePath: string }[],
): Promise<{ schema: Schema.Unversioned.Unversioned; revisions: Revision.Revision[] }> => {
  const revisionInputsLoaded = await Promise.all(Arr.map(revisionInputs, async revisionInput => {
    const schemaFile = await Grafaid.Schema.read(revisionInput.filePath)
    // Should never happen since these paths come from the glob.
    if (!schemaFile) throw new Error(`Failed to read schema file: ${revisionInput.filePath}`)

    return {
      ...revisionInput,
      schema: schemaFile.content,
    }
  }))
  debug(`read revisions`)

  // Sort by date ascending (oldest first)
  revisionInputsLoaded.sort((a, b) => a.date.localeCompare(b.date))

  const revisions = await Promise.all(
    Arr.map(revisionInputsLoaded, async (item, index): Promise<Revision.Revision> => {
      const current = item
      const previous = revisionInputsLoaded[index - 1]

      const before = previous?.schema ?? Grafaid.Schema.empty
      const after = current.schema

      const changes = await Change.calcChangeset({
        before,
        after,
      })

      return Revision.make({
        _tag: 'Revision',
        date: DateOnly.make(current.date),
        changes,
      })
    }),
  )

  // Get the latest schema (last in the array after sorting)
  const latestSchemaData = revisionInputsLoaded[revisionInputsLoaded.length - 1]?.schema
  if (!latestSchemaData) throw new Error('No schema files found')

  // Create unversioned schema with full revisions
  const schema = Schema.Unversioned.make({
    _tag: 'SchemaUnversioned',
    revisions: revisions.slice().reverse(), // Back to chronological order
    definition: latestSchemaData, // GraphQLSchema object
  })

  // Reverse revisions to have newest first
  revisions.reverse()

  debug(`computed revisions`)
  return { schema, revisions }
}
