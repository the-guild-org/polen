import { Grafaid } from '#lib/grafaid'
import { TypeKindNameEnum } from '#lib/grafaid/schema/type-kind-name'
import { EffectKit } from '#lib/kit-temp'
import { S } from '#lib/kit-temp/effect'
import type { ObjReplace } from '#lib/kit-temp/other'
import * as EnumType from './enum-type.js'
import * as InputObjectType from './input-object-type.js'
import * as InterfaceType from './interface-type.js'
import * as ObjectType from './object-type.js'
import * as ScalarType from './scalar-type.js'
import * as UnionType from './union-type.js'

// ============================================================================
// Schema and Type
// ============================================================================

export type Lifecycle =
  | ObjectType.ObjectType
  | InterfaceType.InterfaceType
  | InputObjectType.InputObjectType
  | UnionType.UnionType
  | EnumType.EnumType
  | ScalarType.ScalarType

export type LifecycleEncoded =
  | ObjectType.ObjectTypeEncoded
  | InterfaceType.InterfaceTypeEncoded
  | InputObjectType.InputObjectTypeEncoded
  | UnionType.UnionTypeEncoded
  | EnumType.EnumTypeEncoded
  | ScalarType.ScalarTypeEncoded

const LifecycleSchema = S.Union(
  ObjectType.ObjectTypeSchema,
  InterfaceType.InterfaceTypeSchema,
  InputObjectType.InputObjectTypeSchema,
  UnionType.UnionTypeSchema,
  EnumType.EnumTypeSchema,
  ScalarType.ScalarTypeSchema,
)

export const Lifecycle: S.Schema<Lifecycle, LifecycleEncoded> = LifecycleSchema as any

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Lifecycle)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Lifecycle)
export const decodeSync = S.decodeSync(Lifecycle)
export const encode = S.encode(Lifecycle)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Lifecycle)

// ============================================================================
// Factory
// ============================================================================

export const make = EffectKit.Schema.UnionAdt.makeMake(LifecycleSchema)

// ============================================================================
// Type Utilities
// ============================================================================

import type { TypeKindName } from '#lib/grafaid/schema/type-kind-name'

/**
 * Type-level mapping from GraphQL kind to Lifecycle tag
 */
export type GraphQLKindToLifecycleTag<$K extends TypeKindName> = $K extends 'Object'
  ? EffectKit.Schema.TaggedStruct.ArgTag<typeof ObjectType.ObjectTypeSchema>
  : $K extends 'Interface' ? EffectKit.Schema.TaggedStruct.ArgTag<typeof InterfaceType.InterfaceTypeSchema>
  : $K extends 'InputObject' ? EffectKit.Schema.TaggedStruct.ArgTag<typeof InputObjectType.InputObjectTypeSchema>
  : $K extends 'Union' ? EffectKit.Schema.TaggedStruct.ArgTag<typeof UnionType.UnionTypeSchema>
  : $K extends 'Enum' ? EffectKit.Schema.TaggedStruct.ArgTag<typeof EnumType.EnumTypeSchema>
  : $K extends 'Scalar' ? EffectKit.Schema.TaggedStruct.ArgTag<typeof ScalarType.ScalarTypeSchema>
  : never

export const GraphQLKindToLifecycleTag = {
  [TypeKindNameEnum.Object]: EffectKit.Schema.TaggedStruct.getTag(ObjectType.ObjectTypeSchema),
  [TypeKindNameEnum.Interface]: EffectKit.Schema.TaggedStruct.getTag(InterfaceType.InterfaceTypeSchema),
  [TypeKindNameEnum.InputObject]: EffectKit.Schema.TaggedStruct.getTag(InputObjectType.InputObjectTypeSchema),
  [TypeKindNameEnum.Union]: EffectKit.Schema.TaggedStruct.getTag(UnionType.UnionTypeSchema),
  [TypeKindNameEnum.Enum]: EffectKit.Schema.TaggedStruct.getTag(EnumType.EnumTypeSchema),
  [TypeKindNameEnum.Scalar]: EffectKit.Schema.TaggedStruct.getTag(ScalarType.ScalarTypeSchema),
} as const satisfies Record<
  Exclude<Grafaid.Schema.TypeKindName, 'List' | 'NonNull'>,
  EffectKit.Schema.UnionAdt.GetTags<typeof LifecycleSchema>
>
