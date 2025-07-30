import type { Ob } from '#lib/kit-temp/$'
import { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { Arr } from '@wollybeard/kit'
import type { ReadonlyRecord } from 'effect/Record'
import type { SimplifyDeep } from 'type-fest'

type AnyAdt = EffectKit.Schema.UnionAdt.$any
type AnyStruct = EffectKit.Schema.TaggedStruct.$any

// ============================================================================
// Options
// ============================================================================

export interface Options<
  $Keys extends Options.Keys = Options.Keys,
> {
  keys?: $Keys
}

export interface OptionsWithDefualts<
  $Keys extends Options.Keys = Options.KeysDefaut,
> {
  keys?: $Keys
}

export namespace Options {
  export type Key = string
  export type Keys = readonly Key[]
  export type KeysGiven = readonly [Key, ...readonly Key[]]

  export type KeysEmpty = readonly []
  export type KeysDefaut = KeysEmpty

  export type WithKeysAsStruct = { readonly keys: Keys }
  export type WithKeysAsAdt = { readonly keys: ReadonlyRecord<string, Keys> }

  export type WithKeysGiven = WithKeysGivenAsAdt | WithKeysGivenAsStruct
  export type WithKeysGivenAsStruct = { readonly keys: Options.KeysGiven }
  // @claude is there a non conditional type here to say NON EMPTY?
  export type WithKeysGivenAsAdt = { keys: Record<string, KeysGiven> }

  // dprint-ignore
  export type ReadKeysGivenOrDefault<$Options extends Options> =
    [ReadKeysGiven<$Options>] extends [never] ? KeysDefaut : ReadKeysGiven<$Options>

  // dprint-ignore
  export type ReadKeysGiven<$Options extends Options> =
  $Options extends WithKeysGivenAsStruct
    ? $Options['keys']
    : $Options extends WithKeysGivenAsAdt
      ? Ob.Values<$Options['keys']>
      : never

  export type KeyValue = string | number

  export type InferParameter<
    $S extends EffectKit.Schema.$any,
  > = SimplifyDeep<{
    keys?: InferParameterPropertyKeys<$S>
  }>

  export type InferParameterPropertyKeys<
    $Schema extends EffectKit.Schema.$any,
    ___Encoded extends object = S.Schema.Encoded<$Schema>,
  > = $Schema extends AnyAdt ? _ForAdt<$Schema>
    : $Schema extends EffectKit.Schema.TaggedStruct.$any ? _ForStruct<$Schema>
    : never

  export type _ForAdt<
    $S extends AnyAdt,
  > = Arr.ReduceWithIntersection<_ForAdt_<EffectKit.Schema.Union.Arg.Members<$S>>>

  export type _ForAdt_<
    $Members extends ReadonlyArray<EffectKit.Schema.TaggedStruct.$any>,
  > = {
    [i in keyof $Members]: {
      [k in EffectKit.Schema.TaggedStruct.ArgTag<$Members[i]> & PropertyKey]: _ForStruct<
        $Members[i]
      >
    }
  }

  export type _ForStruct<
    $S extends AnyStruct,
    ___Encoded extends object = EffectKit.Schema.ArgEncoded<$S>,
    ___CandidateObject extends object = PickUniqueKeysCandidate<___Encoded>,
  > = keyof ___CandidateObject extends never ? readonly [] : Ob.KeysReadonlyArray<___CandidateObject>

  export type PickUniqueKeysCandidate<$Encoded extends object> = EffectKit.TaggedStruct.OmitTag<
    Ob.PickWhereValueExtends<$Encoded, KeyValue>
  >
}
