import type { GraphQLField, GraphQLOutputField } from '#lib/grafaid-old/grafaid'
import { type GraphQLArgument, type GraphQLInputField, isNamedType } from 'graphql'
import type { RootTypeMap } from './RootTypeMap.js'

// dprint-ignore
export {
  GraphQLEnumType as Enum,
  isEnumType as isEnum,

  GraphQLInputObjectType as InputObject,
  isInputObjectType as isInputObject,

  GraphQLInterfaceType as Interface,
  isInterfaceType as isInterface,

  GraphQLList as List,
  isListType as isList,

  GraphQLNonNull as NonNull,
  isNonNullType as isNonNull,

  GraphQLObjectType as Object,
  isObjectType as isObject,

  GraphQLScalarType as Scalar,
  isScalarType as isScalar,

  GraphQLUnionType as Union,
  isUnionType as isUnion,

  GraphQLDirective as Directive,
  isDirective,

  type GraphQLInputField as InputField,

  // type GraphQLField as OutputField,

  type GraphQLArgument as Argument,

  getNamedType as getNamed,
} from 'graphql'

export type OutputField<TSource = any, TContext = any, TArgs = any> = GraphQLOutputField<TSource, TContext, TArgs>

export const isOutputField = (value: unknown): value is GraphQLField => {
  return typeof value === 'object' && value !== null && 'args' in value && 'type' in value && 'name' in value
}

export const isArgument = (value: unknown): value is GraphQLArgument => {
  return typeof value === 'object' && value !== null
    && 'name' in value && 'type' in value
    && 'defaultValue' in value && !('args' in value)
}

export const isInputField = (value: unknown): value is GraphQLInputField => {
  return typeof value === 'object' && value !== null
    && 'name' in value && 'type' in value
    && 'defaultValue' in value && !('args' in value)
}

export const isRoot = (map: RootTypeMap, type: unknown): boolean => {
  return isNamedType(type) && map.list.some(_ => _.name.canonical === type.name)
}
