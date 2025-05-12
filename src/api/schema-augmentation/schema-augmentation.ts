import type { GrafaidOld } from '#lib/grafaid-old/index.js'
import { neverCase } from '@wollybeard/kit'
import * as AugmentationDescription from './augmentations/description.js'

export { AugmentationDescription }

export type Augmentation = AugmentationDescription.DescriptionAugmentation

export const apply = (
  schema: GrafaidOld.Schema.Schema,
  augmentations: Augmentation[],
): GrafaidOld.Schema.Schema => {
  for (const augmentation of augmentations) {
    switch (augmentation.type) {
      // eslint-disable-next-line
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
