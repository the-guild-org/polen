import { z } from 'zod'

/**
 * Common parameter schemas for CLI commands
 */

export const projectParameter = z
  .string()
  .optional()
  .describe(`The path to the project directory. Default is CWD (current working directory).`)

export const allowGlobalParameter = z
  .boolean()
  .optional()
  .describe(
    `Allow using global Polen in a project with local Polen. Not recommended as it can cause version conflicts.`,
  )
