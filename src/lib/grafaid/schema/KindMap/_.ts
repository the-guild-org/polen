import type { GraphQLInterfaceType } from 'graphql'
import { getRootTypeMap } from '../RootTypeMap.ts'
import type { Schema } from '../schema.ts'
import * as Type from '../type.ts'
import { isRoot } from '../type.ts'
import { isScalarTypeCustom } from '../typeGuards.ts'
import type { KindMap } from './__.ts'

export const Name = {
  Root: `Root`,
  ScalarCustom: `ScalarCustom`,
  ScalarStandard: `ScalarStandard`,
  Enum: `Enum`,
  InputObject: `InputObject`,
  OutputObject: `OutputObject`,
  Interface: `Interface`,
  Union: `Union`,
} satisfies Record<KindName, KindName>

export type KindName = keyof KindMap[`list`]

export const getKindMap = (schema: Schema): KindMap => {
  const rootTypeMap = getRootTypeMap(schema)
  const typeMap = schema.getTypeMap()
  const typeMapValues = Object.values(typeMap)

  const kindMap: KindMap = {
    root: rootTypeMap,
    index: {
      Root: {
        query: rootTypeMap.types.Query,
        mutation: rootTypeMap.types.Mutation,
        subscription: rootTypeMap.types.Subscription,
      },
      OutputObject: {},
      InputObject: {},
      Interface: {},
      Union: {},
      Enum: {},
      ScalarCustom: {},
      ScalarStandard: {},
    },
    list: {
      Root: [rootTypeMap.types.Query, rootTypeMap.types.Mutation, rootTypeMap.types.Subscription]
        .filter(_ => _ !== null),
      OutputObject: [],
      InputObject: [],
      Interface: [],
      Union: [],
      Enum: [],
      ScalarCustom: [],
      ScalarStandard: [],
    },
  }

  for (const type of typeMapValues) {
    if (type.name.startsWith(hiddenTypePrefix)) continue
    switch (true) {
      case Type.isScalar(type):
        if (isScalarTypeCustom(type)) {
          kindMap.list.ScalarCustom.push(type)
          kindMap.index.ScalarCustom[type.name] = type
        } else {
          kindMap.list.ScalarStandard.push(type)
          kindMap.index.ScalarStandard[type.name] = type
        }
        break
      case Type.isEnum(type):
        kindMap.list.Enum.push(type)
        kindMap.index.Enum[type.name] = type
        break
      case Type.isInputObject(type):
        kindMap.list.InputObject.push(type)
        kindMap.index.InputObject[type.name] = type
        break
      case Type.isInterface(type):
        kindMap.list.Interface.push(type)
        kindMap.index.Interface[type.name] = type
        break
      case Type.isObject(type):
        if (!isRoot(rootTypeMap, type)) {
          kindMap.list.OutputObject.push(type)
          kindMap.index.OutputObject[type.name] = type
        }
        break
      case Type.isUnion(type):
        kindMap.list.Union.push(type)
        kindMap.index.Union[type.name] = type
        break
      default:
        // skip
        break
    }
  }
  return kindMap
}

export const hasCustomScalars = (typeMapByKind: KindMap) => {
  return typeMapByKind.list.ScalarCustom.length > 0
}

export const getInterfaceImplementors = (
  typeMap: KindMap,
  interfaceTypeSearch: GraphQLInterfaceType,
) => {
  const outputObjectTypes = typeMap.list.OutputObject.filter(objectType =>
    objectType.getInterfaces().filter(interfaceType => interfaceType.name === interfaceTypeSearch.name).length > 0
  )
  const interfaceTypes = typeMap.list.Interface.filter(interfaceType =>
    interfaceType.getInterfaces().filter(interfaceType => interfaceType.name === interfaceTypeSearch.name).length > 0
  )
  return [...outputObjectTypes, ...interfaceTypes]
}

// todo put in some central place
const hiddenTypePrefix = `__`
