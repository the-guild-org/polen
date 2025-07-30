import { Resource } from '#lib/kit-temp/$$'
import { S } from '#lib/kit-temp/effect'
import { NodeFileSystem } from '@effect/platform-node'
import { Effect } from 'effect'

/**
 * Schema for the routes manifest generated during build.
 * This manifest contains all concrete routes that need to be generated for SSG.
 */
export const RoutesManifestSchema = S.Struct({
  version: S.String,
  timestamp: S.String,
  totalRoutes: S.Number,
  routes: S.Array(S.String),
})

export type RoutesManifest = S.Schema.Type<typeof RoutesManifestSchema>

/**
 * Resource for reading and writing the routes manifest.
 * The manifest is stored as routes.manifest.json in the build assets directory.
 */
const routesManifestResource = Resource.create({
  name: 'routes-manifest',
  path: 'routes.manifest.json',
  schema: RoutesManifestSchema,
})

/**
 * Get a routes manifest from the specified directory.
 *
 * @param directory - The directory containing the routes.manifest.json file
 * @returns Promise resolving to the routes manifest
 */
export const get = async (directory: string): Promise<RoutesManifest> => {
  return Effect.runPromise(
    routesManifestResource.read(directory).pipe(
      Effect.provide(NodeFileSystem.layer),
      Effect.catchAll(error =>
        Effect.fail(
          new Error(
            `Failed to load routes manifest from ${directory}/routes.manifest.json. Ensure the build has completed successfully. ${error.message}`,
          ),
        )
      ),
    ),
  )
}

/**
 * Write a routes manifest to the specified directory.
 *
 * @param manifest - The routes manifest to write
 * @param directory - The directory where to write the routes.manifest.json file
 */
export const write = async (manifest: RoutesManifest, directory: string): Promise<void> => {
  return Effect.runPromise(
    routesManifestResource.write(manifest, directory).pipe(
      Effect.provide(NodeFileSystem.layer),
      Effect.catchAll(error => Effect.fail(new Error(`Failed to write routes manifest: ${error.message}`))),
    ),
  )
}
