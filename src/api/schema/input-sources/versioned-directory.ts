import { InputSource } from '#api/schema/input-source/$'
import { InputSourceError } from '#api/schema/input-source/$$'
import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Grafaid } from '#lib/grafaid'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { debugPolen } from '#singletons/debug'
import { PlatformError } from '@effect/platform/Error'
import { FileSystem } from '@effect/platform/FileSystem'
import { Arr, Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import { type GraphQLSchema } from 'graphql'

const debug = debugPolen.sub(`schema:data-source-versioned-schema-directory`)

const defaultPaths = {
  schemaDirectory: `./schema`,
}

/**
 * Configuration for loading versioned schemas from a directory structure.
 *
 * Each version is organized in its own subdirectory containing a schema.graphql file.
 * This enables clear version boundaries and better organization for APIs with
 * distinct versions (as opposed to just revisions).
 */
export interface ConfigInput {
  /**
   * Path to the directory containing version subdirectories.
   *
   * Each subdirectory represents a version and must contain a `schema.graphql` file.
   * Version directories can be named using semantic versioning (e.g., "1.0.0", "2.1.0")
   * or other version schemes.
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
   *   v1/
   *     schema.graphql
   *   v2/
   *     schema.graphql
   *   v3/
   *     schema.graphql
   * ```
   */
  path?: string
}

export interface Config {
  path: string
}

export const normalizeConfig = (configInput: ConfigInput, projectRoot: string): Config => {
  const config: Config = {
    path: configInput.path
      ? Path.ensureAbsolute(configInput.path, projectRoot)
      : Path.join(projectRoot, defaultPaths.schemaDirectory),
  }

  return config
}

interface VersionInfo {
  name: string
  path: string
  schemaPath: string
  version: Version.Version
}

export const readOrThrow = (
  configInput: ConfigInput,
  projectRoot: string,
): Effect.Effect<null | Catalog.Versioned.Versioned, InputSourceError, FileSystem> =>
  Effect.gen(function*() {
    const config = normalizeConfig(configInput, projectRoot)

    debug(`will search for version directories in`, config.path)

    const fs = yield* FileSystem
    let entries: string[]
    const dirResult = yield* Effect.either(fs.readDirectory(config.path))
    if (dirResult._tag === 'Left') {
      debug(`error reading directory:`, dirResult.left)
      return null
    }
    entries = dirResult.right

    // Find all directories that contain a schema.graphql file
    const versionInfos: VersionInfo[] = []

    for (const entry of entries) {
      const versionPath = join(config.path, entry)
      const schemaPath = join(versionPath, 'schema.graphql')

      // Check if this is a directory with a schema.graphql file
      const fileExistsResult = yield* Effect.either(fs.stat(schemaPath))
      if (fileExistsResult._tag === 'Right' && fileExistsResult.right.type === 'File') {
        // Parse the version name
        const versionResult = yield* Effect.either(Effect.try({
          try: () => Version.fromString(entry),
          catch: () => new Error(`Invalid version format: ${entry}`),
        }))

        if (versionResult._tag === 'Right') {
          versionInfos.push({
            name: entry,
            path: versionPath,
            schemaPath,
            version: versionResult.right,
          })
        } else {
          debug(`skipping ${entry} - invalid version format`)
        }
      } else {
        // Not a valid version directory, skip
        debug(`skipping ${entry} - no schema.graphql found`)
      }
    }

    if (!Arr.isntEmpty(versionInfos)) {
      debug(`no version directories with schema.graphql found`)
      return null
    }

    debug(`found ${versionInfos.length} version directories`, versionInfos.map(v => v.name))

    // Sort versions using the built-in version ordering
    versionInfos.sort((a, b) => Version.order(a.version, b.version))
    debug(`sorted versions`, versionInfos.map(v => v.name))

    // Load all schemas
    const versions = yield* Effect.all(
      Arr.map(versionInfos, (versionInfo) =>
        Effect.gen(function*() {
          const content = yield* fs.readFileString(versionInfo.schemaPath)
          const ast = yield* Grafaid.Schema.AST.parse(content).pipe(
            Effect.mapError((error) =>
              InputSourceError(
                'versionedDirectory',
                `Failed to parse schema from ${versionInfo.schemaPath}: ${error}`,
                error,
              )
            ),
          )
          const schema = yield* Grafaid.Schema.fromAST(ast).pipe(
            Effect.mapError((error) =>
              InputSourceError(
                'versionedDirectory',
                `Failed to build schema from ${versionInfo.schemaPath}: ${error}`,
                error,
              )
            ),
          )

          return {
            ...versionInfo,
            schema,
          }
        })),
      { concurrency: 'unbounded' },
    )

    // Create catalog entries for each version
    const catalogEntries = yield* Effect.all(
      Arr.map(versions, (version, index) =>
        Effect.gen(function*() {
          const current = version
          const previous = versions[index - 1]

          // For versioned schemas, we don't calculate changes between versions
          // Each version is considered independent
          let changes: Change.Change[] = []

          // Create revision for this version
          const revision = Revision.make({
            date: DateOnly.make(new Date().toISOString().split('T')[0]!), // Using current date since versions don't have dates
            changes,
          })

          // Schema definition is just the GraphQLSchema object
          const schemaDefinition = current.schema

          // Create parent schema if there's a previous version
          const parentSchema = previous
            ? Schema.Versioned.make({
              version: previous.version, // Use the parsed Version object
              parent: null, // We'll keep lineage simple for now
              revisions: [revision],
              definition: previous.schema,
            })
            : null

          // Create the versioned schema
          const schema = Schema.Versioned.make({
            version: current.version, // Use the parsed Version object
            parent: parentSchema,
            revisions: [revision],
            definition: schemaDefinition,
          })

          return {
            schema,
            parent: parentSchema,
            revisions: [revision],
          }
        })),
      { concurrency: 'unbounded' },
    )

    // Reverse to have newest first
    catalogEntries.reverse()

    debug(`computed ${catalogEntries.length} entries`)
    return Catalog.Versioned.make({
      entries: catalogEntries,
    })
  })

export const loader = InputSource.createEffect({
  name: 'versionedDirectory',
  isApplicable: (configInput: ConfigInput, context) =>
    Effect.gen(function*() {
      const config = normalizeConfig(configInput, context.paths.project.rootDir)

      // Check if directory exists
      const fs = yield* FileSystem
      const dirStatsResult = yield* Effect.either(fs.stat(config.path))
      if (dirStatsResult._tag === 'Left' || dirStatsResult.right.type !== 'Directory') {
        return false
      }

      // Check if it has any entries
      const entriesResult = yield* Effect.either(fs.readDirectory(config.path))
      if (entriesResult._tag === 'Left') {
        return false
      }

      const entries = entriesResult.right

      // Check if at least one entry looks like a version directory with a schema
      for (const entry of entries) {
        // Try to parse as version
        const versionResult = yield* Effect.either(Effect.try({
          try: () => Version.fromString(entry),
          catch: () => new Error(`Invalid version: ${entry}`),
        }))

        if (versionResult._tag === 'Right') {
          // Check if it has a schema file
          const schemaPath = Path.join(config.path, entry, 'schema.graphql')
          const schemaStatsResult = yield* Effect.either(fs.stat(schemaPath))
          if (schemaStatsResult._tag === 'Right' && schemaStatsResult.right.type === 'File') {
            return true
          }
        }
      }

      return false
    }),
  readIfApplicableOrThrow: (configInput: ConfigInput, context) =>
    Effect.gen(function*() {
      const config = normalizeConfig(configInput, context.paths.project.rootDir)
      debug('readIfApplicableOrThrow checking path:', config.path)

      // Check if the directory exists first
      const fs = yield* FileSystem
      const dirStatsResult = yield* Effect.either(fs.stat(config.path))
      if (dirStatsResult._tag === 'Left') {
        debug('directory does not exist:', config.path)
        return null
      }

      const entriesResult = yield* Effect.either(fs.readDirectory(config.path))
      if (entriesResult._tag === 'Left') {
        debug('error reading directory:', entriesResult.left)
        return null
      }

      const entries = entriesResult.right
      debug('found entries:', entries)

      // Look for at least one valid version directory with schema.graphql
      for (const entry of entries) {
        const schemaPath = Path.join(config.path, entry, 'schema.graphql')
        debug(`checking entry ${entry} for schema at ${schemaPath}`)

        // Try to parse as version
        const versionResult = yield* Effect.either(Effect.try({
          try: () => Version.fromString(entry),
          catch: (error) => new Error(`Failed to parse version ${entry}: ${error}`),
        }))

        if (versionResult._tag === 'Left') {
          debug(`failed to parse version ${entry}:`, versionResult.left)
          continue // Skip invalid version format
        }

        debug(`parsed version: ${entry} -> ${JSON.stringify(versionResult.right)}`)

        // Try to read the schema file to confirm it exists
        const schemaExistsResult = yield* Effect.either(fs.stat(schemaPath))
        if (schemaExistsResult._tag === 'Right' && schemaExistsResult.right.type === 'File') {
          debug('found valid schema, proceeding with full read')
          // Found at least one valid version directory, proceed with full read
          const catalog = yield* readOrThrow(configInput, context.paths.project.rootDir)
          debug('catalog result:', catalog)
          return catalog
        } else {
          debug(`failed to read schema for ${entry}:`, schemaExistsResult.left)
        }
      }

      debug('no valid version directories found')
      return null
    }),
})
