import { Codec, Err, Resource } from '@wollybeard/kit'
import { z } from 'zod/v4'

export const PolenBuildManifestSchema = z.object({
  type: z.enum(['ssg', 'ssr']),
  version: z.string(),
  basePath: z.string(),
}).loose()

export type PolenBuildManifest = z.infer<typeof PolenBuildManifestSchema>

export const buildManifest = Resource.create({
  name: 'polen-build-manifest',
  path: '.polen/build.json',
  codec: Codec.fromZod(PolenBuildManifestSchema),

}
