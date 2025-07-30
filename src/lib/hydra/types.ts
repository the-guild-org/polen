import type { EffectKit, S } from '#lib/kit-temp/effect'

export type AnyAdt = EffectKit.Schema.UnionAdt.$any
export type AnyStruct = EffectKit.Schema.TaggedStruct.$any
export type AnySchema = S.Schema<any, any, any>
