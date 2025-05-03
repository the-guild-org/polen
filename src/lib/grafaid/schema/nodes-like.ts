import type {
  GraphQLArgument,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
} from 'graphql'
import { isOutputField } from './typeGuards.js'

export type Field = GraphQLField<any, any> | GraphQLInputField

export const isField = (value: object): value is GraphQLField<any, any> | InputField => {
  return isOutputField(value) || isInputField(value)
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
