import { z } from 'zod'

/**
 * Common parameter schemas for CLI commands
 */

export const projectParameter = z
  .string()
  .optional()
  .describe(`The path to the project directory. Default is CWD (current working directory).`)
