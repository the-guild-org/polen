import { InputSource } from '#api/schema/input-source/$'
import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Grafaid } from '#lib/grafaid'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { debugPolen } from '#singletons/debug'
import { Arr, Path } from '@wollybeard/kit'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

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

export const readOrThrow = async (
  configInput: ConfigInput,
  projectRoot: string,
): Promise<null | Catalog.Versioned.Versioned> => {
  const config = normalizeConfig(configInput, projectRoot)

  debug(`will search for version directories in`, config.path)

  let entries: string[]
  try {
    entries = await readdir(config.path, { withFileTypes: false })
  } catch (error) {
    debug(`directory not found or not accessible`, config.path)
    return null
  }

  // Find all directories that contain a schema.graphql file
  const versionInfos: VersionInfo[] = []

  for (const entry of entries) {
    const versionPath = join(config.path, entry)
    const schemaPath = join(versionPath, 'schema.graphql')

    try {
      // Check if this is a directory with a schema.graphql file
      const schema = await Grafaid.Schema.read(schemaPath)
      if (schema) {
        // Parse the version name
        try {
          const version = Version.fromString(entry)
          versionInfos.push({
            name: entry,
            path: versionPath,
            schemaPath,
            version,
          })
        } catch {
          debug(`skipping ${entry} - invalid version format`)
        }
      }
    } catch {
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
  const versions = await Promise.all(
    Arr.map(versionInfos, async (versionInfo) => {
      const schemaFile = await Grafaid.Schema.read(versionInfo.schemaPath)
      if (!schemaFile) {
        throw new Error(`Failed to read schema from ${versionInfo.schemaPath}`)
      }

      return {
        ...versionInfo,
        schema: schemaFile.content,
      }
    }),
  )

  // Create catalog entries for each version
  const catalogEntries = await Promise.all(
    Arr.map(versions, async (version, index): Promise<Catalog.Versioned.Entry> => {
      const current = version
      const previous = versions[index - 1]

      // Calculate changes from previous version
      const changes = previous
        ? await Change.calcChangeset({
          before: previous.schema,
          after: current.schema,
        })
        : []

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
    }),
  )

  // Reverse to have newest first
  catalogEntries.reverse()

  debug(`computed ${catalogEntries.length} entries`)
  return Catalog.Versioned.make({
    _tag: 'CatalogVersioned',
    entries: catalogEntries,
  })
}

export const loader = InputSource.create({
  name: 'versionedDirectory',
  readIfApplicableOrThrow: async (configInput: ConfigInput, context) => {
    const config = normalizeConfig(configInput, context.paths.project.rootDir)

    // Check if the directory exists and has version subdirectories
    try {
      const entries = await readdir(config.path, { withFileTypes: false })

      // Look for at least one valid version directory with schema.graphql
      for (const entry of entries) {
        const schemaPath = join(config.path, entry, 'schema.graphql')
        try {
          const version = Version.fromString(entry)
          // Try to read the schema file to confirm it exists
          const schema = await Grafaid.Schema.read(schemaPath)
          if (schema) {
            // Found at least one valid version directory, proceed with full read
            const catalog = await readOrThrow(configInput, context.paths.project.rootDir)
            return catalog
          }
        } catch {
          // Invalid version format, skip
        }
      }

      return null
    } catch {
      return null
    }
  },
})
