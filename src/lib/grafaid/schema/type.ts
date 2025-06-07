import {
  type GraphQLEnumType,
  type GraphQLInputObjectType,
  type GraphQLInterfaceType,
  type GraphQLList,
  type GraphQLNonNull,
  type GraphQLObjectType,
  type GraphQLScalarType,
  type GraphQLUnionType,
  isNamedType,
} from 'graphql'
import type { RootTypeMap } from './RootTypeMap.ts'

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
} from 'graphql'

export type Type =
  | GraphQLEnumType
  | GraphQLInputObjectType
  | GraphQLInterfaceType
  | GraphQLObjectType
  | GraphQLScalarType
  | GraphQLUnionType
  | GraphQLList<any>
  | GraphQLNonNull<any>

export const isRoot = (map: RootTypeMap, type: Type): boolean => {
  return isNamedType(type) && map.list.some(_ => _.name.canonical === type.name)
}
