import { Codec, Resource } from '@wollybeard/kit'
import { z } from 'zod/v4'

export const DeploymentMetadataSchema = z.object({
  timestamp: z.iso.datetime(),
  pullRequest: z.object({
    number: z.number(),
    branch: z.string(),
    commit: z.string(),
    title: z.string().optional(),
    author: z.string().optional(),
  }),
  deployment: z.object({
    url: z.url(),
    environment: z.string(),
  }),
})

export type DeploymentMetadata = z.infer<typeof DeploymentMetadataSchema>

export const metadata = Resource.create({
  name: `deployment-metadata`,
  path: `.deployment.json`,
  codec: Codec.fromZod(DeploymentMetadataSchema),
  init: {
    auto: true,
    value: () => ({
      timestamp: new Date().toISOString(),
      pullRequest: {
        number: 0,
        branch: `unknown`,
        commit: `unknown`,
      },
      deployment: {
        url: ``,
        environment: `unknown`,
      },
    }),
  },
})
