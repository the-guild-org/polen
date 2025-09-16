import type { Case } from '#lib/kit-temp'
import { Ts } from '@wollybeard/kit'
import { describe, expect, test } from 'vitest'
import { EffectKit } from './$.js'
import { S } from './effect.js'

const A = S.TaggedStruct('A', { a: S.String })
const B = S.TaggedStruct('B', { b: S.Number })
const AB = S.Union(A, B)

type _ExtractSingleTests = [
  Case<Ts.AssertExact<EffectKit.Schema.TaggedStruct.ExtractByTag<'A', typeof A>, typeof A>>,
  Case<Ts.AssertExact<EffectKit.Schema.TaggedStruct.ExtractByTag<'Wrong', typeof A>, never>>,
]

type _ExtractUnionTests = [
  Case<Ts.AssertExact<EffectKit.Schema.TaggedStruct.ExtractByTag<'A', typeof AB>, typeof A>>,
  Case<Ts.AssertExact<EffectKit.Schema.TaggedStruct.ExtractByTag<'B', typeof AB>, typeof B>>,
  Case<Ts.AssertExact<EffectKit.Schema.TaggedStruct.ExtractByTag<'C', typeof AB>, never>>,
]

type _PredicateTests = [
  Case<Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'A', typeof AB>, true>>,
  Case<Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'B', typeof AB>, true>>,
  Case<Ts.AssertExact<EffectKit.Schema.TaggedStruct.DoesTaggedUnionContainTag<'Wrong', typeof AB>, false>>,
]
