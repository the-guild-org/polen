import type { GrafaidOld } from '#lib/grafaid-old/index.js'
import { casesHandled } from '#lib/prelude/prelude.js'
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
        casesHandled(augmentation.type)
    }
  }

  return schema
}
