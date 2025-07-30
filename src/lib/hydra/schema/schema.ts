import { S } from '#lib/kit-temp/effect'
import type { Value } from '../value/$.js'

export type UniqueKeysInput<$Schema extends Base> = ReadonlyArray<GetPickableKeys<$Schema>>

export type GetPickableKeys<$Schema extends Base> = Value.GetPickableUniqueKeys<S.Schema.Type<$Schema>>

export type Base = S.Schema.Any

export type BaseHydrated = S.TaggedStruct<any, any>

export type IsHydratable<$T extends S.Schema.Any> = S.Schema.Type<$T> extends Value.Hydratable ? true
  : false
