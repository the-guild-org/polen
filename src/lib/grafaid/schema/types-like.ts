import {
  type GraphQLInputObjectType,
  type GraphQLInterfaceType,
  type GraphQLNamedType,
  type GraphQLObjectType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
} from 'graphql'

export type Named = GraphQLNamedType

export type Fielded = FieldedInput | FieldedOutput

export const isFielded = (type: GraphQLNamedType): type is Fielded => {
  return isFieldedOutput(type) || isFieldedInput(type)
}

export type FieldedOutput = GraphQLInterfaceType | GraphQLObjectType

export const isFieldedOutput = (type: GraphQLNamedType): type is FieldedOutput => {
  return isInterfaceType(type) || isObjectType(type)
}

export type FieldedInput = GraphQLInputObjectType

export const isFieldedInput = (type: GraphQLNamedType): type is FieldedInput => {
  return isInputObjectType(type)
}
