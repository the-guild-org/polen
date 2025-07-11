import { Fs } from '@wollybeard/kit'
import consola from 'consola'

export interface ValidateProjectOptions {
  mustExist?: boolean
  mustBeEmpty?: boolean
  silent?: boolean
}

/**
 * Validate a project directory for Polen operations.
 * Used by CLI commands to ensure valid project paths.
 */
export async function validateProjectDirectory(
  dir: string,
  options: ValidateProjectOptions = {},
): Promise<boolean> {
  const { mustExist = true, mustBeEmpty = false, silent = false } = options

  const stat = await Fs.stat(dir)

  if (Fs.isNotFoundError(stat)) {
    if (mustExist) {
      if (!silent) consola.error(`Project directory does not exist: ${dir}`)
      return false
    }
    return true
  }

  if (!stat.isDirectory()) {
    if (!silent) consola.error(`Project path is not a directory: ${dir}`)
    return false
  }

  if (mustBeEmpty && !(await Fs.isEmptyDir(dir))) {
    if (!silent) consola.error(`Project directory is not empty: ${dir}`)
    return false
  }

  return true
}
