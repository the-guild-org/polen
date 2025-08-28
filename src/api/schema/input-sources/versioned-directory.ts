import { InputSource } from '#api/schema/input-source/$'
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
  version: Version.Version
  parentVersion: Version.Version | null
  branchDate: string | null
  revisionFiles: string[]
}

export const readOrThrow = (
  configInput: ConfigInput,
  projectRoot: string,
): Effect.Effect<null | Catalog.Versioned.Versioned, InputSource.InputSourceError | PlatformError, FileSystem> =>
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

    // Find all directories and parse their naming convention
    const versionInfos: VersionInfo[] = []

    for (const entry of entries) {
      const versionPath = Path.join(config.path, entry)

      // Check if this is a directory
      const dirStatsResult = yield* Effect.either(fs.stat(versionPath))
      if (dirStatsResult._tag === 'Left' || dirStatsResult.right.type !== 'Directory') {
        debug(`skipping ${entry} - not a directory`)
        continue
      }

      // Parse the directory name: <version>[><parent>@<date>]
      let versionStr: string
      let parentVersion: Version.Version | null = null
      let branchDate: string | null = null

      const branchMatch = entry.match(/^([^>]+)>([^@]+)(?:@([\d-]+))?$/)
      if (branchMatch) {
        // Has branch point: "2.0.0>1.0.0@2024-03-20" or "2.0.0>1.0.0"
        versionStr = branchMatch[1]!
        const parentVersionStr = branchMatch[2]!
        branchDate = branchMatch[3] || null

        // Parse parent version
        const parentVersionResult = yield* Effect.either(Effect.try({
          try: () => Version.fromString(parentVersionStr),
          catch: () => new Error(`Invalid parent version format: ${parentVersionStr}`),
        }))

        if (parentVersionResult._tag === 'Left') {
          debug(`skipping ${entry} - invalid parent version format`)
          continue
        }
        parentVersion = parentVersionResult.right
      } else {
        // Simple version: "1.0.0"
        versionStr = entry
      }

      // Parse the version
      const versionResult = yield* Effect.either(Effect.try({
        try: () => Version.fromString(versionStr),
        catch: () => new Error(`Invalid version format: ${versionStr}`),
      }))

      if (versionResult._tag === 'Left') {
        debug(`skipping ${entry} - invalid version format`)
        continue
      }

      // Look for revision files (YYYY-MM-DD.graphql) or fallback to schema.graphql
      const dirFiles = yield* fs.readDirectory(versionPath)
      const revisionFiles = dirFiles
        .filter(file => /^\d{4}-\d{2}-\d{2}\.graphql$/.test(file))
        .sort() // Sort chronologically

      // If no revision files, check for schema.graphql
      if (revisionFiles.length === 0) {
        const schemaPath = Path.join(versionPath, 'schema.graphql')
        const schemaExistsResult = yield* Effect.either(fs.stat(schemaPath))
        if (schemaExistsResult._tag === 'Right' && schemaExistsResult.right.type === 'File') {
          // Use today's date for the single schema file
          const today = new Date().toISOString().split('T')[0]!
          revisionFiles.push('schema.graphql')
        } else {
          debug(`skipping ${entry} - no schema files found`)
          continue
        }
      }

      versionInfos.push({
        name: entry,
        path: versionPath,
        version: versionResult.right,
        parentVersion,
        branchDate,
        revisionFiles,
      })
    }

    if (!Arr.isntEmpty(versionInfos)) {
      debug(`no version directories with schema.graphql found`)
      return null
    }

    debug(`found ${versionInfos.length} version directories`, versionInfos.map(v => v.name))

    // Sort versions using the built-in version ordering
    versionInfos.sort((a, b) => Version.order(a.version, b.version))
    debug(`sorted versions`, versionInfos.map(v => v.name))

    // Load all versions with their revisions
    const versions = yield* Effect.all(
      Arr.map(versionInfos, (versionInfo) =>
        Effect.gen(function*() {
          // Load all revision files for this version
          const revisionData = yield* Effect.all(
            Arr.map(versionInfo.revisionFiles, (revisionFile) =>
              Effect.gen(function*() {
                const filePath = Path.join(versionInfo.path, revisionFile)
                const content = yield* fs.readFileString(filePath)
                const ast = yield* Grafaid.Schema.AST.parse(content).pipe(
                  Effect.mapError((error) =>
                    InputSource.InputSourceError(
                      'versionedDirectory',
                      `Failed to parse schema from ${filePath}: ${error}`,
                      error,
                    )
                  ),
                )
                const schema = yield* Grafaid.Schema.fromAST(ast).pipe(
                  Effect.mapError((error) =>
                    InputSource.InputSourceError(
                      'versionedDirectory',
                      `Failed to build schema from ${filePath}: ${error}`,
                      error,
                    )
                  ),
                )

                // Extract date from filename or use today for schema.graphql
                let date: string
                if (revisionFile === 'schema.graphql') {
                  date = new Date().toISOString().split('T')[0]!
                } else {
                  date = revisionFile.replace('.graphql', '')
                }

                return {
                  date,
                  schema,
                }
              })),
            { concurrency: 'unbounded' },
          )

          return {
            ...versionInfo,
            revisions: revisionData,
          }
        })),
      { concurrency: 'unbounded' },
    )

    // Build a map of versions for parent lookups
    const versionMap = new Map<string, typeof versions[0]>()
    for (const version of versions) {
      versionMap.set(Version.toString(version.version), version)
    }

    // Create catalog entries for each version
    const catalogEntries = yield* Effect.all(
      Arr.map(versions, (version) =>
        Effect.gen(function*() {
          // Calculate revisions with changes
          const revisions = yield* Effect.all(
            Arr.map(version.revisions, (revisionData, index) =>
              Effect.gen(function*() {
                const current = revisionData
                const previous = version.revisions[index - 1]

                const before = previous?.schema ?? Grafaid.Schema.empty
                const after = current.schema

                const changes = yield* Change.calcChangeset({ before, after }).pipe(
                  Effect.mapError((error) =>
                    InputSource.InputSourceError(
                      'versionedDirectory',
                      `Failed to calculate changeset for ${version.name}: ${error}`,
                      error,
                    )
                  ),
                )

                return Revision.make({
                  date: DateOnly.make(current.date),
                  changes,
                })
              })),
            { concurrency: 1 }, // Sequential for correct changeset calculation
          )

          // Get the latest schema definition
          const latestRevision = version.revisions[version.revisions.length - 1]
          const schemaDefinition = latestRevision?.schema ?? Grafaid.Schema.empty

          // Find parent schema based on parentVersion and branchDate
          let parentSchema: Schema.Versioned.Versioned | null = null
          if (version.parentVersion) {
            const parentVersionStr = Version.toString(version.parentVersion)
            const parentVersionData = versionMap.get(parentVersionStr)

            if (parentVersionData) {
              // Find the specific revision to branch from
              let parentRevision: Revision.Revision | null = null
              if (version.branchDate && parentVersionData.revisions.length > 0) {
                // Find the revision matching the branch date
                const matchingRevisionIndex = parentVersionData.revisions.findIndex(
                  rev => rev.date === version.branchDate,
                )
                if (matchingRevisionIndex >= 0) {
                  // Calculate parent's revisions up to branch point
                  const parentRevisions = yield* Effect.all(
                    Arr.map(parentVersionData.revisions.slice(0, matchingRevisionIndex + 1), (revData, idx) =>
                      Effect.gen(function*() {
                        const current = revData
                        const previous = idx > 0 ? parentVersionData.revisions[idx - 1] : null

                        const before = previous?.schema ?? Grafaid.Schema.empty
                        const after = current.schema

                        const changes = yield* Change.calcChangeset({ before, after }).pipe(
                          Effect.mapError((error) =>
                            InputSource.InputSourceError(
                              'versionedDirectory',
                              `Failed to calculate parent changeset: ${error}`,
                              error,
                            )
                          ),
                        )

                        return Revision.make({
                          date: DateOnly.make(current.date),
                          changes,
                        })
                      })),
                    { concurrency: 1 },
                  )

                  const parentSchemaAtBranch = parentVersionData.revisions[matchingRevisionIndex]?.schema
                  parentSchema = Schema.Versioned.make({
                    version: version.parentVersion,
                    parent: null, // TODO: Support nested parent relationships
                    revisions: parentRevisions.reverse(), // Newest first
                    definition: parentSchemaAtBranch ?? Grafaid.Schema.empty,
                  })
                }
              } else {
                // No specific branch date or no revisions - use parent's initial state
                parentSchema = Schema.Versioned.make({
                  version: version.parentVersion,
                  parent: null,
                  revisions: [],
                  definition: parentVersionData.revisions[0]?.schema ?? Grafaid.Schema.empty,
                })
              }
            }
          }

          // Create the versioned schema
          const schema = Schema.Versioned.make({
            version: version.version,
            parent: parentSchema,
            revisions: revisions.slice().reverse(), // Newest first
            definition: schemaDefinition,
          })

          return {
            schema,
            parent: parentSchema,
            revisions: revisions.slice().reverse(),
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

      // Check if at least one entry looks like a version directory
      for (const entry of entries) {
        const versionPath = Path.join(config.path, entry)

        // Check if it's a directory
        const dirStatsResult = yield* Effect.either(fs.stat(versionPath))
        if (dirStatsResult._tag === 'Left' || dirStatsResult.right.type !== 'Directory') {
          continue
        }

        // Parse version from directory name (handle branch syntax)
        let versionStr = entry
        const branchMatch = entry.match(/^([^>]+)>/)
        if (branchMatch) {
          versionStr = branchMatch[1]!
        }

        // Try to parse as version
        const versionResult = yield* Effect.either(Effect.try({
          try: () => Version.fromString(versionStr),
          catch: () => new Error(`Invalid version: ${versionStr}`),
        }))

        if (versionResult._tag === 'Right') {
          // Check for revision files or schema.graphql
          const dirFiles = yield* Effect.either(fs.readDirectory(versionPath))
          if (dirFiles._tag === 'Right') {
            const hasRevisions = dirFiles.right.some(file =>
              /^\d{4}-\d{2}-\d{2}\.graphql$/.test(file) || file === 'schema.graphql'
            )
            if (hasRevisions) {
              return true
            }
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

      // Look for at least one valid version directory
      for (const entry of entries) {
        const versionPath = Path.join(config.path, entry)
        debug(`checking entry ${entry}`)

        // Check if it's a directory
        const dirStatsResult = yield* Effect.either(fs.stat(versionPath))
        if (dirStatsResult._tag === 'Left' || dirStatsResult.right.type !== 'Directory') {
          continue
        }

        // Parse version from directory name
        let versionStr = entry
        const branchMatch = entry.match(/^([^>]+)>/)
        if (branchMatch) {
          versionStr = branchMatch[1]!
        }

        // Try to parse as version
        const versionResult = yield* Effect.either(Effect.try({
          try: () => Version.fromString(versionStr),
          catch: (error) => new Error(`Failed to parse version ${versionStr}: ${error}`),
        }))

        if (versionResult._tag === 'Left') {
          debug(`failed to parse version ${versionStr}:`, versionResult.left)
          continue
        }

        debug(`parsed version: ${versionStr} -> ${JSON.stringify(versionResult.right)}`)

        // Check for schema files
        const dirFiles = yield* Effect.either(fs.readDirectory(versionPath))
        if (dirFiles._tag === 'Right') {
          const hasSchemaFiles = dirFiles.right.some(file =>
            /^\d{4}-\d{2}-\d{2}\.graphql$/.test(file) || file === 'schema.graphql'
          )

          if (hasSchemaFiles) {
            debug('found valid schema files, proceeding with full read')
            // Found at least one valid version directory, proceed with full read
            const catalog = yield* readOrThrow(configInput, context.paths.project.rootDir)
            debug('catalog result:', catalog)
            return catalog
          }
        }
      }

      debug('no valid version directories found')
      return null
    }),
})
