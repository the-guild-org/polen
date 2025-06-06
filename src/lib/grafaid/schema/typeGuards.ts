import type { GraphQLInputObjectType } from 'graphql'
import { type GraphQLField, type GraphQLScalarType, isNonNullType, isScalarType } from 'graphql'
import { standardScalarTypeNames } from './scalars.ts'

export const isScalarTypeCustom = (node: GraphQLScalarType): boolean => {
  return !(node.name in standardScalarTypeNames)
}

export const isScalarTypeAndCustom = (node: unknown): node is GraphQLScalarType => {
  return isScalarType(node) && isScalarTypeCustom(node)
}

export const isAllInputObjectFieldsNullable = (node: GraphQLInputObjectType) => {
  return Object.values(node.getFields()).some(_ => !isNonNullType(_.type))
}

export const isOutputField = (value: object): value is GraphQLField<any, any> => {
  return `args` in value
}
