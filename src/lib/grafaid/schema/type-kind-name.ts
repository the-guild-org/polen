import type { GraphQLNamedType } from 'graphql'
import { TypeClassNameEnum, type TypeClassToName, typeClassToName } from './type-class-name.ts'

export const TypeKindNameEnum = {
  Scalar: `Scalar`,
  Object: `Object`,
  Interface: `Interface`,
  Union: `Union`,
  Enum: `Enum`,
  InputObject: `InputObject`,
  List: `List`,
  NonNull: `NonNull`,
} as const

export namespace TypeKindName {
  export type Enum = typeof TypeKindNameEnum.Enum
  export type InputObject = typeof TypeKindNameEnum.InputObject
  export type List = typeof TypeKindNameEnum.List
  export type NonNull = typeof TypeKindNameEnum.NonNull
  export type Object = typeof TypeKindNameEnum.Object
  export type Interface = typeof TypeKindNameEnum.Interface
  export type Union = typeof TypeKindNameEnum.Union
  export type Scalar = typeof TypeKindNameEnum.Scalar
}

export type TypeKindName =
  | TypeKindName.Enum
  | TypeKindName.InputObject
  | TypeKindName.List
  | TypeKindName.NonNull
  | TypeKindName.Object
  | TypeKindName.Interface
  | TypeKindName.Union
  | TypeKindName.Scalar

export const typeKindFromClass = <$TypeClass extends GraphQLNamedType>(
  typeClass: $TypeClass,
): TypeClassNameToKindMap[TypeClassToName<$TypeClass>] => {
  const typeClassName = typeClassToName(typeClass)
  const kindName = typeClassNameToKindMap[typeClassName]
  return kindName
}

export const typeClassNameToKindMap = {
  [TypeClassNameEnum.Scalar]: TypeKindNameEnum.Scalar,
  [TypeClassNameEnum.Object]: TypeKindNameEnum.Object,
  [TypeClassNameEnum.Interface]: TypeKindNameEnum.Interface,
  [TypeClassNameEnum.Union]: TypeKindNameEnum.Union,
  [TypeClassNameEnum.Enum]: TypeKindNameEnum.Enum,
  [TypeClassNameEnum.InputObject]: TypeKindNameEnum.InputObject,
  [TypeClassNameEnum.List]: TypeKindNameEnum.List,
  [TypeClassNameEnum.NonNull]: TypeKindNameEnum.NonNull,
}

export type TypeClassNameToKindMap = typeof typeClassNameToKindMap
