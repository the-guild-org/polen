import { Placement } from '#api/schema/augmentations/placement'
import { GraphQLSchemaPath } from '#lib/graphql-schema-path'
import { S } from '#lib/kit-temp/effect'

export const AugmentationConfig = S.Struct({
  on: GraphQLSchemaPath.Path,
  placement: Placement,
  content: S.String,
})

export type AugmentationConfig = S.Schema.Type<typeof AugmentationConfig>
