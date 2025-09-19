import { E, O } from '#dep/effect'
import { FileSystem } from '@effect/platform/FileSystem'
import consola from 'consola'
import { Data, Effect } from 'effect'

// Custom error types
export class ProjectNotFoundError extends Data.TaggedError('ProjectNotFoundError')<{
  readonly path: string
}> {}

export class ProjectNotDirectoryError extends Data.TaggedError('ProjectNotDirectoryError')<{
  readonly path: string
}> {}

export class ProjectNotEmptyError extends Data.TaggedError('ProjectNotEmptyError')<{
  readonly path: string
  readonly fileCount: number
}> {}

export type ProjectValidationError = ProjectNotFoundError | ProjectNotDirectoryError | ProjectNotEmptyError | Error

export interface ValidateProjectOptions {
  mustExist?: boolean
  mustBeEmpty?: boolean
  silent?: boolean
}

/**
 * Validate a project directory for Polen operations.
 * Returns an Effect that yields true if valid, false if invalid based on options.
 *
 * @param dir - The directory to validate
 * @param options - Validation options
 * @returns Effect yielding boolean indicating if directory is valid
 */
export const validateProjectDirectory = (
  dir: string,
  options: ValidateProjectOptions = {},
): Effect.Effect<boolean, ProjectValidationError, FileSystem> => {
  const { mustExist = true, mustBeEmpty = false, silent = false } = options

  return Effect.gen(function*() {
    const fs = yield* FileSystem
    const statResult = yield* Effect.either(fs.stat(dir))

    if (E.isLeft(statResult)) {
      if (mustExist) {
        if (!silent) consola.error(`Project directory does not exist: ${dir}`)
        return false
      }
      return true
    }

    const stat = statResult.right
    if (stat.type !== 'Directory') {
      if (!silent) consola.error(`Project path is not a directory: ${dir}`)
      return false
    }

    if (mustBeEmpty) {
      const files = yield* fs.readDirectory(dir)
      if (files.length > 0) {
        if (!silent) consola.error(`Project directory is not empty: ${dir}`)
        return false
      }
    }

    return true
  })
}
