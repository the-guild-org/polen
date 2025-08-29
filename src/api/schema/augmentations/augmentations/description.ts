import type { GrafaidOld } from '#lib/grafaid-old'
import { S } from '#lib/kit-temp/effect'
import { neverCase } from '@wollybeard/kit/language'
import { TargetSchema } from '../target.js'
import { locateTargetField, locateTargetType } from '../target.js'

// ============================================================================
// Schema
// ============================================================================

export const PlacementSchema = S.Literal('before', 'after', 'over')
export type Placement = S.Schema.Type<typeof PlacementSchema>

export const DescriptionAugmentationSchema = S.Struct({
  type: S.Literal('description'),
  on: TargetSchema,
  placement: PlacementSchema,
  content: S.String,
})

export type DescriptionAugmentation = S.Schema.Type<typeof DescriptionAugmentationSchema>

// ============================================================================
// Constants
// ============================================================================

export const Placement = {
  Before: `before` as const,
  After: `after` as const,
  Over: `over` as const,
}

export const applyDescriptionContent = (
  type: GrafaidOld.Groups.Describable,
  augmentation: DescriptionAugmentation,
) => {
  const existingDescription = type.description ?? ``

  switch (augmentation.placement) {
    case `before`:
      type.description = `${augmentation.content}\n\n${existingDescription}`
      break
    case `after`:
      type.description = `${existingDescription}\n\n${augmentation.content}`
      break
    case `over`:
      type.description = augmentation.content
      break
    default:
      neverCase(augmentation.placement)
  }
}

export const apply = (schema: GrafaidOld.Schema.Schema, augmentation: DescriptionAugmentation) => {
  switch (augmentation.on.type) {
    case `TargetType`: {
      const type = locateTargetType(schema, augmentation.on)
      applyDescriptionContent(type, augmentation)
      break
    }
    case `TargetField`: {
      const field = locateTargetField(schema, augmentation.on)
      applyDescriptionContent(field, augmentation)
      break
    }
    default:
      neverCase(augmentation.on)
  }
}
