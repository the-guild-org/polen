import { O, S } from '#dep/effect'
import { FileSystem } from '@effect/platform'
import { Resource } from '@wollybeard/kit'
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
const routesManifestResource = Resource.createSchemaResource(
  'routes.manifest.json',
  RoutesManifestSchema,
  { version: '1.0.0', timestamp: new Date().toISOString(), totalRoutes: 0, routes: [] } as RoutesManifest,
)

/**
 * Get a routes manifest from the specified directory.
 *
 * @param directory - The directory containing the routes.manifest.json file
 * @returns Effect resolving to the routes manifest
 */
export const get = (directory: string): Effect.Effect<RoutesManifest, Error, FileSystem.FileSystem> => {
  return routesManifestResource.read(directory).pipe(
    Effect.flatMap(O.match({
      onNone: () => Effect.fail(new Error(`Routes manifest not found in ${directory}/routes.manifest.json`)),
      onSome: Effect.succeed,
    })),
    Effect.catchAll(error =>
      Effect.fail(
        new Error(
          `Failed to load routes manifest from ${directory}/routes.manifest.json. Ensure the build has completed successfully.`,
        ),
      )
    ),
  )
}

/**
 * Write a routes manifest to the specified directory.
 *
 * @param manifest - The routes manifest to write
 * @param directory - The directory where to write the routes.manifest.json file
 */
export const write = (
  manifest: RoutesManifest,
  directory: string,
): Effect.Effect<void, Error, FileSystem.FileSystem> => {
  return routesManifestResource.write(manifest, directory).pipe(
    Effect.catchAll(error => Effect.fail(new Error(`Failed to write routes manifest`))),
  )
}
