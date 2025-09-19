import { S } from '#dep/effect'

/**
 * Schema for validating front matter content
 */
export const MetadataSchema = S.Struct({
  description: S.optional(S.String),
  hidden: S.optionalWith(S.Boolean, { default: () => false }),
})

export type Metadata = S.Schema.Type<typeof MetadataSchema>
