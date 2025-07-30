import { FileSystem, Path } from '@effect/platform'
import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { IO } from './service.js'

// ============================================================================
// File-based IO Layer
// ============================================================================

/**
 * Node.js file system based IO service layer using Effect platform
 * Only handles string operations - JSON parsing/stringifying is done by Bridge
 */
export const File = (basePath: string) =>
  Layer.effect(
    IO,
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path

      return {
        read: (relativePath: string) =>
          Effect.gen(function*() {
            const fullPath = path.join(basePath, relativePath)
            const content = yield* fs.readFileString(fullPath)
            return content
          }).pipe(
            Effect.mapError((error) => new Error(`Failed to read ${relativePath}: ${error}`)),
          ),

        write: (relativePath: string, data: string) =>
          Effect.gen(function*() {
            const fullPath = path.join(basePath, relativePath)
            // Ensure directory exists
            const dir = path.dirname(fullPath)
            yield* fs.makeDirectory(dir, { recursive: true })
            yield* fs.writeFileString(fullPath, data)
          }).pipe(
            Effect.mapError((error) => new Error(`Failed to write ${relativePath}: ${error}`)),
          ),

        list: (relativePath: string) =>
          Effect.gen(function*() {
            const fullPath = path.join(basePath, relativePath)
            return yield* fs.readDirectory(fullPath).pipe(
              Effect.catchTag(
                'SystemError',
                (error) => error.reason === 'NotFound' ? Effect.succeed([]) : Effect.fail(error),
              ),
            )
          }).pipe(
            Effect.mapError((error) => new Error(`Failed to list ${relativePath}: ${error}`)),
          ),

        remove: (relativePath: string) =>
          Effect.gen(function*() {
            const fullPath = path.join(basePath, relativePath)
            yield* fs.remove(fullPath).pipe(
              Effect.catchTag(
                'SystemError',
                (error) => error.reason === 'NotFound' ? Effect.succeed(undefined) : Effect.fail(error),
              ),
            )
          }).pipe(
            Effect.mapError((error) => new Error(`Failed to remove ${relativePath}: ${error}`)),
          ),
      }
    }),
  ).pipe(
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(NodePath.layer),
  )
