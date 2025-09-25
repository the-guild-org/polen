import { Op, S } from '#dep/effect'
import { Ef } from '#dep/effect'
import type { FileSystem } from '@effect/platform/FileSystem'
import { FsLoc, Resource } from '@wollybeard/kit'

export const PolenBuildManifestSchema = S.Struct({
  type: S.Literal('ssg', 'ssr'),
  version: S.String,
  basePath: S.String,
})

export type PolenBuildManifest = typeof PolenBuildManifestSchema.Type

const buildManifestResource = Resource.createSchemaResource(
  '.polen/build.json',
  PolenBuildManifestSchema,
  {} as PolenBuildManifest, // empty value
)

/**
 * Resource for reading and writing the Polen build manifest.
 * The manifest contains information about the build type and configuration.
 */
export const buildManifest = {
  /**
   * Read the build manifest from the specified directory.
   * Returns an Effect that yields an Option of the manifest.
   * @param directory - The directory containing the .polen/build.json file
   * @returns Effect yielding Option<PolenBuildManifest>
   */
  read: (
    directory: FsLoc.AbsDir,
  ): Ef.Effect<Op.Option<PolenBuildManifest>, Resource.ResourceError, FileSystem> =>
    buildManifestResource.read(directory),

  /**
   * Write the build manifest to the specified directory.
   * @param data - The manifest data to write
   * @param directory - The directory where to write the .polen/build.json file
   * @returns Effect yielding void on success
   */
  write: (
    data: PolenBuildManifest,
    directory: FsLoc.AbsDir,
  ): Ef.Effect<void, Resource.ResourceError, FileSystem> => buildManifestResource.write(data, directory),
}
