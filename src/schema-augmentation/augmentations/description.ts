import type { Grafaid } from '../../lib/grafaid/index.js'
import type { Target } from '../target.js'
import { casesHandled } from '../../lib/prelude/main.js'
import { locateTargetField, locateTargetType } from '../target.js'

export const Placement = {
  Before: `before`,
  After: `after`,
  Over: `over`,
} as const

export type Placement = (typeof Placement)[keyof typeof Placement]

export interface DescriptionAugmentation {
  type: `description`
  on: Target
  placement: Placement
  content: string
}

export const applyDescriptionContent = (
  type: Grafaid.Groups.Describable,
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
      casesHandled(augmentation.placement)
  }
}

export const apply = (schema: Grafaid.Schema, augmentation: DescriptionAugmentation) => {
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
      casesHandled(augmentation.on)
  }
}
