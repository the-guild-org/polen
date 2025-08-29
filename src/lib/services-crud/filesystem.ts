import { FileSystem, Path } from '@effect/platform'
import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { CrudService } from './service.js'

/**
 * Create a CRUD service layer that adapts Effect Platform FileSystem service.
 *
 * This adapter bridges the gap between the generic CRUD service interface and
 * the rich FileSystem service from Effect Platform. It handles:
 * - Auto-creation of parent directories on write
 * - Path resolution relative to the base path
 * - Error mapping from PlatformError to generic Error
 * - Graceful handling of missing files/directories
 *
 * @param basePath - Base directory path for all operations
 * @returns Layer providing CrudService backed by FileSystem
 */
export const fromFileSystem = (basePath: string) =>
  Layer.effect(
    CrudService,
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path

      return {
        read: (relativePath: string) =>
          fs.readFileString(path.join(basePath, relativePath))
            .pipe(Effect.mapError(error => new Error(`Failed to read ${relativePath}: ${error}`))),

        write: (relativePath: string, data: string) =>
          Effect.gen(function*() {
            const fullPath = path.join(basePath, relativePath)
            const dir = path.dirname(fullPath)
            yield* fs.makeDirectory(dir, { recursive: true })
            yield* fs.writeFileString(fullPath, data)
          }).pipe(Effect.mapError(error => new Error(`Failed to write ${relativePath}: ${error}`))),

        list: (relativePath: string) =>
          fs.readDirectory(path.join(basePath, relativePath))
            .pipe(
              Effect.catchTag(
                'SystemError',
                error => error.reason === 'NotFound' ? Effect.succeed([]) : Effect.fail(error),
              ),
              Effect.mapError(error => new Error(`Failed to list ${relativePath}: ${error}`)),
            ),

        remove: (relativePath: string) =>
          fs.remove(path.join(basePath, relativePath))
            .pipe(
              Effect.catchTag(
                'SystemError',
                error => error.reason === 'NotFound' ? Effect.succeed(undefined) : Effect.fail(error),
              ),
              Effect.mapError(error => new Error(`Failed to remove ${relativePath}: ${error}`)),
            ),
      }
    }),
  ).pipe(
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(NodePath.layer),
  )
