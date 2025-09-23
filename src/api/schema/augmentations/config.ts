import { Placement } from '#api/schema/augmentations/placement'
import { S } from '#dep/effect'
import { GraphQLSchemaPath } from 'graphql-kit'

export const AugmentationConfig = S.Struct({
  on: GraphQLSchemaPath.Path,
  placement: Placement,
  content: S.String,
})

export type AugmentationConfig = typeof AugmentationConfig.Type
