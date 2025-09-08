import { Placement } from '#api/schema/augmentations/placement'
import { GraphQLPath } from '#lib/graphql-path'
import { S } from '#lib/kit-temp/effect'

export const AugmentationConfig = S.Struct({
  on: GraphQLPath.Definition.DefinitionPath,
  placement: Placement,
  content: S.String,
})

export type AugmentationConfig = S.Schema.Type<typeof AugmentationConfig>
