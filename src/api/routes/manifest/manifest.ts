import { S } from '#dep/effect'
import { Resource } from '@wollybeard/kit'

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

export type RoutesManifest = typeof RoutesManifestSchema.Type

/**
 * Resource for reading and writing the routes manifest.
 * The manifest is stored as routes.manifest.json in the build assets directory.
 */
const routesManifestResource = Resource.createSchemaResource(
  'routes.manifest.json',
  RoutesManifestSchema,
  { version: '1.0.0', timestamp: new Date().toISOString(), totalRoutes: 0, routes: [] } as RoutesManifest,
)

export const { read, readOrEmpty, write } = routesManifestResource
