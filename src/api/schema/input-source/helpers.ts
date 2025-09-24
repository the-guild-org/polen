import { InputSourceError } from '#api/schema/input-source/errors'
import { Ef } from '#dep/effect'
import type { FileSystem } from '@effect/platform'
import { Fs, FsLoc } from '@wollybeard/kit'
import type { GraphQLSchema } from 'graphql'
import { Catalog, Change, DateOnly, Grafaid, Revision, Schema } from 'graphql-kit'

/**
 * Normalize path inputs to absolute paths.
 * Handles string paths, FsLoc types, and undefined values with defaults.
 */
export const normalizePathToAbs = {
  /**
   * Normalize a file path input to an absolute file path.
   */
  file: (
    path: string | FsLoc.AbsFile.AbsFile | FsLoc.RelFile.RelFile | undefined,
    projectRoot: FsLoc.AbsDir.AbsDir,
    defaultPath: FsLoc.RelFile.RelFile,
  ): FsLoc.AbsFile.AbsFile => {
    if (!path) {
      return FsLoc.join(projectRoot, defaultPath) as FsLoc.AbsFile.AbsFile
    }

    const normalized = FsLoc.Inputs.normalize.any(path)
    // If it's absolute, ensure it's a file
    if (FsLoc.Groups.Abs.is(normalized)) {
      return normalized._tag === 'LocAbsFile'
        ? normalized
        : FsLoc.AbsFile.decodeSync(FsLoc.encodeSync(normalized).replace(/\/$/, ''))
    }
    // If it's relative, join with project root
    return FsLoc.join(projectRoot, normalized) as FsLoc.AbsFile.AbsFile
  },

  /**
   * Normalize a directory path input to an absolute directory path.
   */
  dir: (
    path: string | FsLoc.AbsDir.AbsDir | FsLoc.RelDir.RelDir | undefined,
    projectRoot: FsLoc.AbsDir.AbsDir,
    defaultPath: FsLoc.RelDir.RelDir,
  ): FsLoc.AbsDir.AbsDir => {
    if (!path) {
      return FsLoc.join(projectRoot, defaultPath) as FsLoc.AbsDir.AbsDir
    }

    const normalized = FsLoc.Inputs.normalize.any(path)
    // If it's absolute, ensure it's a directory
    if (FsLoc.Groups.Abs.is(normalized)) {
      return normalized._tag === 'LocAbsDir'
        ? normalized
        : FsLoc.AbsDir.decodeSync(FsLoc.encodeSync(normalized) + '/')
    }
    // If it's relative, join with project root
    return FsLoc.join(projectRoot, normalized) as FsLoc.AbsDir.AbsDir
  },
}

/**
 * Create an error mapper function for a specific input source.
 * Maps any error to an InputSourceError with appropriate context.
 */
export const mapToInputSourceError = (sourceName: string) => (error: unknown) =>
  new InputSourceError({
    source: sourceName,
    message: error instanceof Error ? error.message : String(error),
    cause: error,
  })

/**
 * Create a catalog with a single revision for sources that only have one version.
 * This is used by file, introspection, and introspection-file sources.
 */
export const createSingleRevisionCatalog = (
  schema: GraphQLSchema,
  sourceName: string,
): Ef.Effect<Catalog.Unversioned, InputSourceError> =>
  Ef.gen(function*() {
    const date = new Date()
    const dateString = date.toISOString().split('T')[0]!
    const before = Grafaid.Schema.empty
    const after = schema

    const changes = yield* Change.calcChangeset({ before, after }).pipe(
      Ef.mapError(mapToInputSourceError(sourceName)),
    )

    const revision = Revision.make({
      date: DateOnly.make(dateString),
      changes,
    })

    const schemaObj = Schema.Unversioned.make({
      revisions: [revision],
      definition: after,
    })

    return Catalog.Unversioned.make({ schema: schemaObj })
  })

/**
 * Find all GraphQL files (.graphql extension) in a directory.
 * Returns just the file names, not full paths.
 */
export const findGraphQLFiles = (
  directory: FsLoc.AbsDir.AbsDir,
) =>
  Fs.glob('*.graphql', { onlyFiles: true, cwd: directory }).pipe(
    Ef.catchAll(() => Ef.succeed([])),
  )

/**
 * Check if a file exists.
 * Returns null if the file doesn't exist or an error occurs.
 */
export const fileExists = (
  path: FsLoc.AbsFile.AbsFile,
): Ef.Effect<boolean, never, FileSystem.FileSystem> =>
  Fs.stat(path).pipe(
    Ef.map(stats => stats.type === 'File'),
    Ef.catchAll(() => Ef.succeed(false)),
  )

/**
 * Check if a directory exists.
 * Returns false if the directory doesn't exist or an error occurs.
 */
export const directoryExists = (
  path: FsLoc.AbsDir.AbsDir,
): Ef.Effect<boolean, never, FileSystem.FileSystem> =>
  Fs.stat(path).pipe(
    Ef.map(stats => stats.type === 'Directory'),
    Ef.catchAll(() => Ef.succeed(false)),
  )
