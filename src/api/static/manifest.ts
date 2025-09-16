import { Resource } from 'graphql-kit'
import { S } from 'graphql-kit'
import { NodeFileSystem } from '@effect/platform-node'
import { Effect } from 'effect'

export const PolenBuildManifestSchema = S.Struct({
  type: S.Literal('ssg', 'ssr'),
  version: S.String,
  basePath: S.String,
})

export type PolenBuildManifest = S.Schema.Type<typeof PolenBuildManifestSchema>

const buildManifestResource = Resource.create({
  name: 'polen-build-manifest',
  path: '.polen/build.json',
  schema: PolenBuildManifestSchema,
})

/**
 * Resource for reading and writing the Polen build manifest.
 * The manifest contains information about the build type and configuration.
 */
export const buildManifest = {
  /**
   * Read the build manifest from the specified directory.
   * @param directory - The directory containing the .polen/build.json file
   * @returns Promise resolving to Either with error or manifest data
   */
  read: async (directory: string) => {
    return Effect.runPromiseExit(
      buildManifestResource.read(directory).pipe(
        Effect.provide(NodeFileSystem.layer),
      ),
    )
  },

  /**
   * Write the build manifest to the specified directory.
   * @param data - The manifest data to write
   * @param directory - The directory where to write the .polen/build.json file
   * @returns Promise resolving to Either with error or void
   */
  write: async (data: PolenBuildManifest, directory: string) => {
    return Effect.runPromiseExit(
      buildManifestResource.write(data, directory).pipe(
        Effect.provide(NodeFileSystem.layer),
      ),
    )
  },
}
