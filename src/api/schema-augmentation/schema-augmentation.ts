import type { Grafaid } from '../../lib/grafaid/index.js'
import { casesHandled } from '../../lib/prelude/main.js'
import * as AugmentationDescription from './augmentations/description.js'

export { AugmentationDescription }

export type Augmentation = AugmentationDescription.DescriptionAugmentation

export const apply = (
  schema: Grafaid.Schema,
  augmentations: Augmentation[],
): Grafaid.Schema => {
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
