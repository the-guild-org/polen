import { Grafaid } from '#lib/grafaid'
import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema
// ============================================================================

export const TargetTypeSchema = S.Struct({
  type: S.Literal('TargetType'),
  name: S.String,
})

export type TargetType = S.Schema.Type<typeof TargetTypeSchema>

export const TargetFieldSchema = S.Struct({
  type: S.Literal('TargetField'),
  name: S.String,
  targetType: S.String,
})

export type TargetField = S.Schema.Type<typeof TargetFieldSchema>

export const TargetSchema = S.Union(TargetTypeSchema, TargetFieldSchema)

export type Target = S.Schema.Type<typeof TargetSchema>

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
  const type = schema.getType(target.targetType)

  if (!type) {
    throw new Error(`Could not find type ${target.targetType}`)
  }

  if (!Grafaid.Schema.TypesLike.isFielded(type)) {
    throw new Error(`Type ${target.targetType} does not have fields`)
  }

  const fields = type.getFields()
  const field = fields[target.name]

  if (!field) {
    // dprint-ignore
    throw new Error(`Could not find field ${target.name} on type ${target.targetType}`)
  }

  return field
}
