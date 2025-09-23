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

const l = FsLoc.fromString

const defaultPaths = {
  schemaDirectory: l(`./schema`),
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

export const readOrThrow = (
  configInput: ConfigInput,
  projectRoot: FsLoc.AbsDir.AbsDir,
): Ef.Effect<
  null | Catalog.Versioned,
  Error | InputSource.InputSourceError | PlatformError,
  FileSystem.FileSystem
> =>
  Ef.gen(function*() {
    const config = normalizeConfig(configInput, projectRoot)

    debug(`will search for version directories in`, config.path)

    // const y = Fs.glob('*', { cwd: config.path })
    const entries = yield* Fs.glob('*', { cwd: config.path, onlyDirectories: true })

    // const dirResult = yield* Ef.either(Fs.read(config.path))

    // if (dirResult._tag === 'Left') {
    //   debug(`error reading directory:`, dirResult.left)
    //   return null
    // }

    // const entries = dirResult.right

    // Find all directories and parse their naming convention
    const versionInfos: VersionInfo[] = []

    for (const entry of entries) {
      const versionPath = FsLoc.join(config.path, entry)

      // Check if this is a directory
      const dirStatsResult = yield* Ef.either(Fs.stat(versionPath))
      if (dirStatsResult._tag === 'Left' || dirStatsResult.right.type !== 'Directory') {
        debug(`skipping ${entry} - not a directory`)
        continue
      }

      // Parse the directory name: <version>[><parent>@<date>]
      let versionStr: string
      let parentVersion: Op.Option<Version.Version> = Op.none()
      let branchDate: Op.Option<string> = Op.none()

      const entryStr = FsLoc.encodeSync(entry)
      const branchMatch = entryStr.match(/^([^>]+)>([^@]+)(?:@([\d-]+))?$/)
      if (branchMatch) {
        // Has branch point: "2.0.0>1.0.0@2024-03-20" or "2.0.0>1.0.0"
        versionStr = branchMatch[1]!
        const parentVersionStr = branchMatch[2]!
        branchDate = branchMatch[3] ? Op.some(branchMatch[3]) : Op.none()

        // Parse parent version
        const parentVersionResult = yield* Ef.either(Ef.try({
          try: () => Version.fromString(parentVersionStr),
          catch: () => new Error(`Invalid parent version format: ${parentVersionStr}`),
        }))

        if (parentVersionResult._tag === 'Left') {
          debug(`skipping ${entry} - invalid parent version format`)
          continue
        }
        parentVersion = Op.some(parentVersionResult.right)
      } else {
        // Simple version: "1.0.0"
        versionStr = entryStr
      }

      // Parse the version
      const versionResult = yield* Ef.either(Ef.try({
        try: () => Version.fromString(versionStr),
        catch: () => new Error(`Invalid version format: ${versionStr}`),
      }))

      if (versionResult._tag === 'Left') {
        debug(`skipping ${entry} - invalid version format`)
        continue
      }

      // Look for revision files (YYYY-MM-DD.graphql) or fallback to schema.graphql
      const dirFiles = yield* Fs.glob('*.graphql', { onlyFiles: true, cwd: versionPath })
      const revisionFiles = dirFiles
        .map(_ => FsLoc.encodeSync(_))
        .filter(file => /^\d{4}-\d{2}-\d{2}\.graphql$/.test(file))
        .sort() // Sort chronologically

      // If no revision files, check for schema.graphql
      if (revisionFiles.length === 0) {
        const schemaPath = FsLoc.join(versionPath, l('schema.graphql'))
        const schemaExistsResult = yield* Ef.either(Fs.stat(schemaPath))
        if (schemaExistsResult._tag === 'Right' && schemaExistsResult.right.type === 'File') {
          revisionFiles.push('schema.graphql')
        } else {
          debug(`skipping ${entry} - no schema files found`)
          continue
        }
      }

      versionInfos.push({
        name: FsLoc.name(entry),
        path: versionPath,
        version: versionResult.right,
        parentVersion,
        branchDate,
        revisionFiles,
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
            Ar.map(versionInfo.revisionFiles, (revisionFile) =>
              Ef.gen(function*() {
                const filePath = FsLoc.join(versionInfo.path, FsLoc.RelFile.decodeSync(revisionFile))
                const content = yield* Fs.readString(filePath)
                const ast = yield* Grafaid.Parse.parseSchema(content, { source: FsLoc.encodeSync(filePath) }).pipe(
                  Ef.mapError(mapToInputSourceError('versionedDirectory')),
                )
                const schema = yield* Grafaid.Schema.fromAST(ast).pipe(
                  Ef.mapError(mapToInputSourceError('versionedDirectory')),
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
      versionMap.set(Version.encodeSync(version.version), version)
    }

    // Create catalog entries for each version
    const catalogEntries = yield* Ef.all(
      Ar.map(versions, (version) =>
        Ef.gen(function*() {
          // Get parent schema for first revision comparison if this is a branched version
          let parentSchemaForComparison: Op.Option<GraphQLSchema> = Op.none()
          if (Op.isSome(version.parentVersion) && Op.isSome(version.branchDate)) {
            const parentVersionStr = Version.encodeSync(version.parentVersion.value)
            const branchDateValue = version.branchDate.value
            const parentVersionData = versionMap.get(parentVersionStr)
            if (parentVersionData) {
              const matchingRevisionIndex = parentVersionData.revisions.findIndex(
                rev => rev.date === branchDateValue,
              )
              if (matchingRevisionIndex >= 0) {
                const schema = parentVersionData.revisions[matchingRevisionIndex]?.schema
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
                  ? parentSchemaForComparison.value
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
          let parentSchema: Schema.Versioned.Versioned | null = null
          if (Op.isSome(version.parentVersion)) {
            const parentVersionStr = Version.encodeSync(version.parentVersion.value)
            const parentVersionData = versionMap.get(parentVersionStr)

            if (parentVersionData) {
              if (Op.isSome(version.branchDate) && parentVersionData.revisions.length > 0) {
                // Find the revision matching the branch date
                const branchDateValue = version.branchDate.value
                const matchingRevisionIndex = parentVersionData.revisions.findIndex(
                  rev => rev.date === branchDateValue,
                )
                if (matchingRevisionIndex >= 0) {
                  // Calculate parent's revisions up to branch point
                  const parentRevisions = yield* Ef.all(
                    Ar.map(parentVersionData.revisions.slice(0, matchingRevisionIndex + 1), (revData, idx) =>
                      Ef.gen(function*() {
                        const current = revData
                        const previous = idx > 0 ? parentVersionData.revisions[idx - 1] : null

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

                  const parentSchemaAtBranch = parentVersionData.revisions[matchingRevisionIndex]?.schema
                  parentSchema = Schema.Versioned.make({
                    version: version.parentVersion.value,
                    branchPoint: null, // TODO: Support nested branchPoint relationships
                    revisions: parentRevisions.reverse(), // Newest first
                    definition: parentSchemaAtBranch ?? Grafaid.Schema.empty,
                  })
                }
              } else {
                // No specific branch date or no revisions - use parent's initial state
                parentSchema = Schema.Versioned.make({
                  version: version.parentVersion.value,
                  branchPoint: null,
                  revisions: [], // No revisions for initial state
                  definition: parentVersionData.revisions[0]?.schema ?? Grafaid.Schema.empty,
                })
              }
            }
          }

          // Create branchPoint if we have a parent and branch date
          let branchPoint: Schema.Versioned.BranchPoint | null = null
          if (parentSchema && Op.isSome(version.branchDate)) {
            // Find the revision at the branch point
            const branchDateValue = version.branchDate.value
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
      const dirStatsResult = yield* Ef.either(Fs.stat(config.path))
      if (dirStatsResult._tag === 'Left' || dirStatsResult.right.type !== 'Directory') {
        return false
      }

      // Check if it h entries
      const entriesResult = yield* Ef.either(Fs.read(config.path))
      if (entriesResult._tag === 'Left') {
        return false
      }

      const entries = entriesResult.right

      // Check if at least one entry looks like a version directory
      for (const entry of entries) {
        const versionPath = FsLoc.join(config.path, FsLoc.RelDir.decodeSync(entry + '/'))

        // Check if it's a directory
        const dirStatsResult = yield* Ef.either(Fs.stat(versionPath))
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
        const versionResult = yield* Ef.either(Ef.try({
          try: () => Version.fromString(versionStr),
          catch: () => new Error(`Invalid version: ${versionStr}`),
        }))

        if (versionResult._tag === 'Right') {
          // Check for revision files or schema.graphql
          const dirFiles = yield* Ef.either(Fs.read(versionPath))
          if (dirFiles._tag === 'Right') {
            const hasRevisions = Ar.some(dirFiles.right, file =>
              /^\d{4}-\d{2}-\d{2}\.graphql$/.test(file) || file === 'schema.graphql')
            if (hasRevisions) {
              return true
            }
          }
        }
      }

      return false
    }),
  readIfApplicableOrThrow: (configInput: ConfigInput, context) =>
    Ef.gen(function*() {
      const config = normalizeConfig(configInput, context.paths.project.rootDir)
      debug('readIfApplicableOrThrow checking path:', FsLoc.encodeSync(config.path))

      // Check if the directory exists first
      const dirStatsResult = yield* Ef.either(Fs.stat(config.path))
      if (dirStatsResult._tag === 'Left') {
        debug('directory does not exist:', FsLoc.encodeSync(config.path))
        return null
      }

      const entries = yield* Fs.glob('*', { cwd: config.path, onlyDirectories: true }) // Ef.either(Fs.read(config.path))
      debug('found entries:', entries)

      // Look for at least one valid version directory
      for (const entry of entries) {
        const name = FsLoc.name(entry)
        const versionPath = FsLoc.join(config.path, entry)
        debug(`checking entry ${entry}`)

        // Parse version from directory name
        let versionStr = name
        const branchMatch = name.match(/^([^>]+)>/)
        if (branchMatch) {
          versionStr = branchMatch[1]!
        }

        // Try to parse as version
        const versionResult = yield* Ef.either(Ef.try({
          try: () => Version.fromString(versionStr),
          catch: (error) => new Error(`Failed to parse version ${versionStr}: ${error}`),
        }))

        if (versionResult._tag === 'Left') {
          debug(`failed to parse version ${versionStr}:`, versionResult.left)
          continue
        }

        debug(`parsed version: ${versionStr} -> ${JSON.stringify(versionResult.right)}`)

        // Check for schema files
        const dirFiles = yield* Fs.glob('*.graphql', { onlyFiles: true, cwd: versionPath })
        const hasSchemaFiles = pipe(
          dirFiles,
          Ar.map(_ => FsLoc.encodeSync(_)),
          Ar.some(file => /^\d{4}-\d{2}-\d{2}\.graphql$/.test(file) || file === 'schema.graphql'),
        )

        if (hasSchemaFiles) {
          debug('found valid schema files, proceeding with full read')
          // Found at least one valid version directory, proceed with full read
          const catalog = yield* readOrThrow(configInput, context.paths.project.rootDir)
          debug('catalog result:', catalog)
          return catalog
        }
      }

      debug('no valid version directories found')
      return null
    }),
})
