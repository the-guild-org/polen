import { GrafaidOld } from '#lib/grafaid-old/index.js'

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
  schema: GrafaidOld.Schema.Schema,
  target: TargetType,
): GrafaidOld.Groups.Named => {
  const type = schema.getType(target.name)
  if (!type) {
    throw new Error(`Could not find type ${target.name}`)
  }
  return type
}

export const locateTargetField = (
  schema: GrafaidOld.Schema.Schema,
  target: TargetField,
): GrafaidOld.GraphQLField => {
  const type = schema.getType(target.typeTarget.name)
  if (!type) {
    throw new Error(`Could not find type ${target.typeTarget.name}`)
  }
  if (!GrafaidOld.isTypeWithFields(type)) {
    throw new Error(`Type ${target.typeTarget.name} does not have fields`)
  }
  const fields = type.getFields()
  const field = fields[target.name]
  if (!field) {
    throw new Error(
      `Could not find field ${target.name} on type ${target.typeTarget.name}`,
    )
  }
  return field
}
