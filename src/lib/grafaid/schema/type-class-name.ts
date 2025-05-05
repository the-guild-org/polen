import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  type GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} from 'graphql'

export const TypeClassNameEnum = {
  Scalar: `GraphQLScalarType`,
  Object: `GraphQLObjectType`,
  Interface: `GraphQLInterfaceType`,
  Union: `GraphQLUnionType`,
  Enum: `GraphQLEnumType`,
  InputObject: `GraphQLInputObjectType`,
  List: `GraphQLList`,
  NonNull: `GraphQLNonNull`,
} as const

export namespace TypeClassName {
  export type Scalar = typeof TypeClassNameEnum.Scalar
  export type Object = typeof TypeClassNameEnum.Object
  export type Interface = typeof TypeClassNameEnum.Interface
  export type Union = typeof TypeClassNameEnum.Union
  export type Enum = typeof TypeClassNameEnum.Enum
  export type InputObject = typeof TypeClassNameEnum.InputObject
  export type List = typeof TypeClassNameEnum.List
  export type NonNull = typeof TypeClassNameEnum.NonNull
}

export type TypeClassName =
  | TypeClassName.Scalar
  | TypeClassName.Object
  | TypeClassName.Interface
  | TypeClassName.Union
  | TypeClassName.Enum
  | TypeClassName.InputObject
  | TypeClassName.List
  | TypeClassName.NonNull

// dprint-ignore
export type TypeClassToName<C> =
    C extends GraphQLScalarType    		? TypeClassName.Scalar
  : C extends GraphQLObjectType    		? TypeClassName.Object
  : C extends GraphQLInterfaceType 		? TypeClassName.Interface
  : C extends GraphQLUnionType     		? TypeClassName.Union
  : C extends GraphQLEnumType      		? TypeClassName.Enum
  : C extends GraphQLInputObjectType 	? TypeClassName.InputObject
  : C extends GraphQLList<any>       	? TypeClassName.List
  : C extends GraphQLNonNull<any>    	? TypeClassName.NonNull
  : never

export const typeClassToName = <$Node extends GraphQLNamedType>(
  node: $Node,
): TypeClassToName<$Node> => {
  switch (true) {
    case isObjectType(node):
      return TypeClassNameEnum.Object as TypeClassToName<$Node>
    case isInputObjectType(node):
      return TypeClassNameEnum.InputObject as TypeClassToName<$Node>
    case isUnionType(node):
      return TypeClassNameEnum.Union as TypeClassToName<$Node>
    case isInterfaceType(node):
      return TypeClassNameEnum.Interface as TypeClassToName<$Node>
    case isEnumType(node):
      return TypeClassNameEnum.Enum as TypeClassToName<$Node>
    case isScalarType(node):
      return TypeClassNameEnum.Scalar as TypeClassToName<$Node>
    default:
      throw new Error(`Unknown node kind: ${String(node)}`)
  }
}

export const namedTypeClassNameToClassMap = {
  [TypeClassNameEnum.Scalar]: GraphQLScalarType,
  [TypeClassNameEnum.Object]: GraphQLObjectType,
  [TypeClassNameEnum.Interface]: GraphQLInterfaceType,
  [TypeClassNameEnum.Union]: GraphQLUnionType,
  [TypeClassNameEnum.Enum]: GraphQLEnumType,
  [TypeClassNameEnum.InputObject]: GraphQLInputObjectType,
} as const

export const typeClassNameToClassMap = {
  [TypeClassNameEnum.NonNull]: GraphQLNonNull,
  [TypeClassNameEnum.List]: GraphQLList,
  ...namedTypeClassNameToClassMap,
} as const
