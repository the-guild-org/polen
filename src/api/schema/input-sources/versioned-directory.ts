import { InputSource } from '#api/schema/input-source/$'
import { mapToInputSourceError, normalizePathToAbs } from '#api/schema/input-source/helpers'
import { Ar, Ef, Op } from '#dep/effect'
import { debugPolen } from '#singletons/debug'
import type { FileSystem } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import { Fs, FsLoc } from '@wollybeard/kit'
import { HashMap, pipe } from 'effect'
import type { GraphQLSchema } from 'graphql'
import { Catalog, Change, DateOnly, Grafaid, Revision, Schema, Version } from 'graphql-kit'

const debug = debugPolen.sub(`schema:data-source-versioned-schema-directory`)

const defaultPaths = {
  schemaDirectory: FsLoc.fromString(`./schema`),
} as const

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
  path?: string | FsLoc.AbsDir.AbsDir | FsLoc.RelDir.RelDir
}

export interface Config {
  path: FsLoc.AbsDir.AbsDir
}

export const normalizeConfig = (configInput: ConfigInput, projectRoot: FsLoc.AbsDir.AbsDir): Config => {
  const config: Config = {
    path: normalizePathToAbs.dir(configInput.path, projectRoot, defaultPaths.schemaDirectory),
  }

  return config
}

interface VersionInfo {
  name: string
  path: FsLoc.AbsDir.AbsDir
  version: Version.Version
  parentVersion: Op.Option<Version.Version>
  branchDate: Op.Option<string>
  revisionFiles: string[]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse version information from a directory name.
 * Supports formats:
 * - Simple: "1.0.0"
 * - Branched: "2.0.0>1.0.0" (version > parent)
 * - Branched with date: "2.0.0>1.0.0@2024-03-20"
 */
const parseVersionFromDirName = (
  dirName: string,
): Op.Option<{
  version: Version.Version
  parentVersion: Op.Option<Version.Version>
  branchDate: Op.Option<string>
}> => {
  const branchMatch = dirName.match(/^([^>]+)>([^@]+)(?:@([\d-]+))?$/)

  if (branchMatch) {
    // Has branch point: "2.0.0>1.0.0@2024-03-20" or "2.0.0>1.0.0"
    const versionStr = branchMatch[1]!
    const parentVersionStr = branchMatch[2]!
    const branchDate = branchMatch[3] ? Op.some(branchMatch[3]) : Op.none()

    try {
      const version = Version.fromString(versionStr)
      const parentVersion = Version.fromString(parentVersionStr)
      return Op.some({
        version,
        parentVersion: Op.some(parentVersion),
        branchDate,
      })
    } catch {
      return Op.none()
    }
  } else {
    // Simple version: "1.0.0"
    try {
      const version = Version.fromString(dirName)
      return Op.some({
        version,
        parentVersion: Op.none(),
        branchDate: Op.none(),
      })
    } catch {
      return Op.none()
    }
  }
}

/**
 * Find all GraphQL schema files in a directory.
 * Returns revision files (YYYY-MM-DD.graphql) sorted chronologically,
 * or falls back to schema.graphql if no revision files exist.
 */
const findSchemaFiles = (
  versionPath: FsLoc.AbsDir.AbsDir,
): Ef.Effect<string[], never, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const dirFiles = yield* Fs.glob('*.graphql', { onlyFiles: true, cwd: versionPath }).pipe(
      Ef.catchAll(() => Ef.succeed([])),
    )
    const fileNames = dirFiles.map(f => FsLoc.name(f))

    // Look for revision files (YYYY-MM-DD.graphql)
    const revisionFiles = fileNames
      .filter(file => /^\d{4}-\d{2}-\d{2}\.graphql$/.test(file))
      .sort() // Sort chronologically

    if (revisionFiles.length > 0) {
      return revisionFiles
    }

    // Fallback to schema.graphql if it exists
    if (fileNames.includes('schema.graphql')) {
      return ['schema.graphql']
    }

    return []
  })

/**
 * Load and parse a single GraphQL schema revision file.
 */
const loadRevision = (
  filePath: FsLoc.AbsFile.AbsFile,
  revisionFileName: string,
): Ef.Effect<{ date: string; schema: GraphQLSchema }, InputSource.InputSourceError, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const content = yield* Fs.readString(filePath).pipe(
      Ef.mapError(mapToInputSourceError('versionedDirectory')),
    )

    const ast = yield* Grafaid.Parse.parseSchema(content, {
      source: FsLoc.encodeSync(filePath),
    }).pipe(
      Ef.mapError(mapToInputSourceError('versionedDirectory')),
    )

    const schema = yield* Grafaid.Schema.fromAST(ast).pipe(
      Ef.mapError(mapToInputSourceError('versionedDirectory')),
    )

    // Extract date from filename or use today for schema.graphql
    const date = revisionFileName === 'schema.graphql'
      ? new Date().toISOString().split('T')[0]!
      : revisionFileName.replace('.graphql', '')

    return { date, schema }
  })

/**
 * Check if a directory is a valid version directory with schema files.
 */
const isValidVersionDirectory = (
  dirPath: FsLoc.AbsDir.AbsDir,
): Ef.Effect<boolean, never, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const schemaFiles = yield* findSchemaFiles(dirPath)
    return schemaFiles.length > 0
  })

export const readOrThrow = (
  configInput: ConfigInput,
  projectRoot: FsLoc.AbsDir.AbsDir,
): Ef.Effect<
  null | Catalog.Versioned,
  InputSource.InputSourceError | PlatformError,
  FileSystem.FileSystem
> =>
  Ef.gen(function*() {
    const config = normalizeConfig(configInput, projectRoot)

    debug(`will search for version directories in`, config.path)

    const entries = yield* Fs.glob('*', { cwd: config.path, onlyDirectories: true }).pipe(
      Ef.mapError(mapToInputSourceError('versionedDirectory')),
    )

    // Find all directories and parse their naming convention
    const versionInfos: VersionInfo[] = []

    for (const entry of entries) {
      const versionPath = FsLoc.join(config.path, entry)
      const dirName = FsLoc.name(entry)

      // Parse version information from directory name
      const versionInfo = parseVersionFromDirName(dirName)
      if (Op.isNone(versionInfo)) {
        debug(`skipping ${dirName} - invalid version format`)
        continue
      }

      // Check for schema files
      const schemaFiles = yield* findSchemaFiles(versionPath)
      if (schemaFiles.length === 0) {
        debug(`skipping ${dirName} - no schema files found`)
        continue
      }

      versionInfos.push({
        name: dirName,
        path: versionPath,
        version: versionInfo.value.version,
        parentVersion: versionInfo.value.parentVersion,
        branchDate: versionInfo.value.branchDate,
        revisionFiles: schemaFiles,
      })
    }

    if (!Ar.isNonEmptyArray(versionInfos)) {
      debug(`no version directories with schema.graphql found`)
      return null
    }

    debug(`found ${versionInfos.length} version directories`, versionInfos.map(v => v.name))

    // Sort versions using the built-in version ordering
    versionInfos.sort((a, b) => Version.order(a.version, b.version))
    debug(`sorted versions`, versionInfos.map(v => v.name))

    // Load all versions with their revisions
    const versions = yield* Ef.all(
      Ar.map(versionInfos, (versionInfo) =>
        Ef.gen(function*() {
          // Load all revision files for this version
          const revisionData = yield* Ef.all(
            Ar.map(versionInfo.revisionFiles, (revisionFile) => {
              const filePath = FsLoc.join(versionInfo.path, FsLoc.RelFile.decodeSync(revisionFile))
              return loadRevision(filePath, revisionFile)
            }),
            { concurrency: 'unbounded' },
          )

          return {
            ...versionInfo,
            revisions: revisionData,
          }
        })),
      { concurrency: 'unbounded' },
    )

    // Build a HashMap of versions for parent lookups using Version objects directly as keys
    const versionMap = pipe(
      versions,
      Ar.reduce(
        HashMap.empty<Version.Version, typeof versions[0]>(),
        (map, version) => HashMap.set(map, version.version, version),
      ),
    )

    // Create catalog entries for each version
    const catalogEntries = yield* Ef.all(
      Ar.map(versions, (version) =>
        Ef.gen(function*() {
          // Get parent schema for first revision comparison if this is a branched version
          let parentSchemaForComparison: Op.Option<GraphQLSchema> = Op.none()
          if (Op.isSome(version.parentVersion) && Op.isSome(version.branchDate)) {
            const branchDateValue = Op.getOrThrow(version.branchDate)
            const parentVersionData = HashMap.get(versionMap, Op.getOrThrow(version.parentVersion))
            if (Op.isSome(parentVersionData)) {
              const matchingRevisionIndex = parentVersionData.value.revisions.findIndex(
                rev => rev.date === branchDateValue,
              )
              if (matchingRevisionIndex >= 0) {
                const schema = parentVersionData.value.revisions[matchingRevisionIndex]?.schema
                parentSchemaForComparison = schema ? Op.some(schema) : Op.none()
              }
            }
          }

          // Calculate revisions with changes
          const revisions = yield* Ef.all(
            Ar.map(version.revisions, (revisionData, index) =>
              Ef.gen(function*() {
                const current = revisionData
                const previous = version.revisions[index - 1]

                // For first revision of a branched version, compare against parent's schema at branch point
                // Otherwise compare against previous revision in same version (or empty if first version)
                const before = index === 0 && Op.isSome(parentSchemaForComparison)
                  ? Op.getOrThrow(parentSchemaForComparison)
                  : (previous?.schema ?? Grafaid.Schema.empty)
                const after = current.schema

                const changes = yield* Change.calcChangeset({ before, after }).pipe(
                  Ef.mapError(mapToInputSourceError('versionedDirectory')),
                )

                return Revision.make({
                  date: DateOnly.make(current.date),
                  changes,
                })
              })),
            { concurrency: 1 }, // Sequential for correct changeset calculation
          )

          // Get the latest schema definition (last element since revisions are still in chronological order)
          const latestRevision = version.revisions[version.revisions.length - 1]
          const schemaDefinition = latestRevision?.schema ?? Grafaid.Schema.empty

          // Find parent schema based on parentVersion and branchDate
          let parentSchema: Schema.Versioned | null = null
          if (Op.isSome(version.parentVersion)) {
            const parentVersionData = HashMap.get(versionMap, Op.getOrThrow(version.parentVersion))

            if (Op.isSome(parentVersionData)) {
              const parentData = parentVersionData.value
              if (Op.isSome(version.branchDate) && parentData.revisions.length > 0) {
                // Find the revision matching the branch date
                const branchDateValue = Op.getOrThrow(version.branchDate)
                const matchingRevisionIndex = parentData.revisions.findIndex(
                  rev => rev.date === branchDateValue,
                )
                if (matchingRevisionIndex >= 0) {
                  // Calculate parent's revisions up to branch point
                  const parentRevisions = yield* Ef.all(
                    Ar.map(parentData.revisions.slice(0, matchingRevisionIndex + 1), (revData, idx) =>
                      Ef.gen(function*() {
                        const current = revData
                        const previous = idx > 0 ? parentData.revisions[idx - 1] : null

                        const before = previous?.schema ?? Grafaid.Schema.empty
                        const after = current.schema

                        const changes = yield* Change.calcChangeset({ before, after }).pipe(
                          Ef.mapError(mapToInputSourceError('versionedDirectory')),
                        )

                        return Revision.make({
                          date: DateOnly.make(current.date),
                          changes,
                        })
                      })),
                    { concurrency: 1 },
                  )

                  const parentSchemaAtBranch = parentData.revisions[matchingRevisionIndex]?.schema
                  parentSchema = Schema.Versioned.make({
                    version: Op.getOrThrow(version.parentVersion),
                    branchPoint: null, // TODO: Support nested branchPoint relationships
                    revisions: parentRevisions.reverse(), // Newest first
                    definition: parentSchemaAtBranch ?? Grafaid.Schema.empty,
                  })
                }
              } else {
                // No specific branch date or no revisions - use parent's initial state
                parentSchema = Schema.Versioned.make({
                  version: Op.getOrThrow(version.parentVersion),
                  branchPoint: null,
                  revisions: [], // No revisions for initial state
                  definition: parentData.revisions[0]?.schema ?? Grafaid.Schema.empty,
                })
              }
            }
          }

          // Create branchPoint if we have a parent and branch date
          let branchPoint: { schema: Schema.Versioned; revision: Revision } | null = null
          if (parentSchema && Op.isSome(version.branchDate)) {
            // Find the revision at the branch point
            const branchDateValue = Op.getOrThrow(version.branchDate)
            const branchRevision = parentSchema.revisions.find(r =>
              DateOnly.equivalence(r.date, DateOnly.make(branchDateValue))
            )
            if (branchRevision) {
              branchPoint = { schema: parentSchema, revision: branchRevision }
            }
          }

          const schema = Schema.Versioned.make({
            version: version.version,
            branchPoint: branchPoint,
            revisions: revisions.slice().reverse(), // Newest first
            definition: schemaDefinition,
          })

          return schema
        })),
      { concurrency: 'unbounded' },
    )

    // Reverse to have newest first
    catalogEntries.reverse()

    // Convert array to HashMap with version as key
    const entriesMap = HashMap.fromIterable(
      catalogEntries.map(entry => [entry.version, entry] as const),
    )

    debug(`computed ${catalogEntries.length} entries`)
    return Catalog.Versioned.make({
      entries: entriesMap,
    })
  })

export const loader = InputSource.create({
  name: 'versionedDirectory',
  isApplicable: (configInput: ConfigInput, context) =>
    Ef.gen(function*() {
      const config = normalizeConfig(configInput, context.paths.project.rootDir)

      // Check if directory exists
      const dirStats = yield* Fs.stat(config.path).pipe(
        Ef.catchAll(() => Ef.succeed(null)),
      )
      if (!dirStats || dirStats.type !== 'Directory') {
        return false
      }

      // Get all subdirectories
      const entries = yield* Fs.glob('*', { cwd: config.path, onlyDirectories: true }).pipe(
        Ef.catchAll(() => Ef.succeed([])),
      )

      // Check if at least one entry is a valid version directory
      for (const entry of entries) {
        const versionPath = FsLoc.join(config.path, entry)
        const dirName = FsLoc.name(entry)

        // Check if it's a valid version directory
        const versionInfo = parseVersionFromDirName(dirName)
        if (Op.isSome(versionInfo)) {
          const isValid = yield* isValidVersionDirectory(versionPath)
          if (isValid) {
            return true
          }
        }
      }

      return false
    }),
  readIfApplicableOrThrow: (configInput: ConfigInput, context) =>
    readOrThrow(configInput, context.paths.project.rootDir),
})
