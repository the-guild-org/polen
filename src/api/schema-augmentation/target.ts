import { Grafaid } from '#lib/grafaid/index.js'

export type Target = TargetType | TargetField

export interface TargetType {
  type: `TargetType`
  name: string
}

export interface TargetField {
  type: `TargetField`
  name: string
  typeTarget: TargetType
}

export const locateTargetType = (
  schema: Grafaid.Schema.Schema,
  target: TargetType,
): Grafaid.Schema.TypesLike.Named => {
  const type = schema.getType(target.name)
  if (!type) {
    throw new Error(`Could not find type ${target.name}`)
  }
  return type
}

export const locateTargetField = (
  schema: Grafaid.Schema.Schema,
  target: TargetField,
): Grafaid.Schema.NodesLike.Field => {
  const type = schema.getType(target.typeTarget.name)

  if (!type) {
    throw new Error(`Could not find type ${target.typeTarget.name}`)
  }

  if (!Grafaid.Schema.TypesLike.isFielded(type)) {
    throw new Error(`Type ${target.typeTarget.name} does not have fields`)
  }

  const fields = type.getFields()
  const field = fields[target.name]

  if (!field) {
    // dprint-ignore
    throw new Error(`Could not find field ${target.name} on type ${target.typeTarget.name}`)
  }

  return field
}
