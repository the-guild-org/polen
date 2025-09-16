import { Placement } from '#api/schema/augmentations/placement'
import { S } from 'graphql-kit'
import { GraphQLSchemaPath } from 'graphql-kit'

export const AugmentationConfig = S.Struct({
  on: GraphQLSchemaPath.Path,
  placement: Placement,
  content: S.String,
})

export type AugmentationConfig = S.Schema.Type<typeof AugmentationConfig>
