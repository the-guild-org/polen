import { InputSourceError } from '#api/schema/input-source/errors'
import { Ef } from '#dep/effect'
import { FsLoc } from '@wollybeard/kit'
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
