import type { GraphQLArgument, GraphQLEnumValue, GraphQLField, GraphQLInputField, GraphQLNamedType } from 'graphql'
import { isOutputField } from './typeGuards.js'
import type { Fielded } from './types-like.js'

export type Field = GraphQLField<any, any> | GraphQLInputField

export const isField = (value: object): value is GraphQLField<any, any> | InputField => {
  return isOutputField(value) || isInputField(value)
}

export const getFields = (type: Fielded): Field[] => {
  return Object.values(type.getFields())
}

export type Describable =
  | GraphQLNamedType
  | Field

export type Deprecatable = GraphQLEnumValue | Field

export const isDeprecatable = (node: object): node is Deprecatable => {
  return `deprecationReason` in node
}

export type InputField = GraphQLArgument | GraphQLInputField

export const isInputField = (value: object): value is InputField => {
  return `defaultValue` in value
}
