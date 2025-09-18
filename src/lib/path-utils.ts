/**
 * Path utility functions to replace @wollybeard/kit Path module
 */
import { Path } from '@wollybeard/kit'

/**
 * Creates a function that joins paths relative to a base path
 * @param basePath - The base path to join from
 * @returns A function that joins a relative path to the base
 */
export const ensureAbsoluteWith = (basePath: string) => (relativePath: string) => Path.join(basePath, relativePath)

// Export Path namespace for convenience
export { Path }
