import type { GrafaidOld } from '#lib/grafaid-old'
import { S } from '#lib/kit-temp/effect'
import { neverCase } from '@wollybeard/kit/language'
import * as AugmentationDescription from './augmentations/description.js'

export { AugmentationDescription }

// ============================================================================
// Schema
// ============================================================================

export const AugmentationSchema = AugmentationDescription.DescriptionAugmentationSchema // Union will expand as more augmentation types are added

export type Augmentation = S.Schema.Type<typeof AugmentationSchema>

export const apply = (
  schema: GrafaidOld.Schema.Schema,
  augmentations: readonly Augmentation[],
): GrafaidOld.Schema.Schema => {
  for (const augmentation of augmentations) {
    switch (augmentation.type) {
      case `description`: {
        AugmentationDescription.apply(schema, augmentation)
        break
      }
      default:
        neverCase(augmentation.type)
    }
  }

  return schema
}
