import { Context, Effect } from 'effect'

/**
 * Core CRUD service interface for basic file operations.
 *
 * This interface provides platform-agnostic CRUD operations for string-based file content.
 * Implementations can target different platforms (filesystem, memory, HTTP, etc.) while
 * maintaining the same interface contract.
 */
export interface CrudService {
  /**
   * Read file contents as a string.
   *
   * @param path - Relative path to the file
   * @returns Effect resolving to file contents as string
   */
  readonly read: (path: string) => Effect.Effect<string, Error>

  /**
   * Write string data to a file.
   * Implementations should auto-create parent directories as needed.
   *
   * @param path - Relative path to the file
   * @param data - String content to write
   * @returns Effect resolving when write is complete
   */
  readonly write: (path: string, data: string) => Effect.Effect<void, Error>

  /**
   * List contents of a directory.
   *
   * @param path - Relative path to the directory
   * @returns Effect resolving to array of filenames in the directory
   */
  readonly list: (path: string) => Effect.Effect<readonly string[], Error>

  /**
   * Remove a file or directory.
   *
   * @param path - Relative path to the file or directory to remove
   * @returns Effect resolving when removal is complete
   */
  readonly remove: (path: string) => Effect.Effect<void, Error>
}

/**
 * Service tag for dependency injection.
 */
export const CrudService = Context.GenericTag<CrudService>('@polen/services-crud/CrudService')
