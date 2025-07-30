import { $Field, $Fields } from '#lib/hydra/$.test.fixture'
import { S } from '#lib/kit-temp/effect'
import { Ts } from '@wollybeard/kit'
import { describe, expect, test } from 'vitest'
import type { _Dehydrated, _MakeDehydratedParametersUsingKeys } from './hydratable.js'
import { getConfig, Hydratable } from './hydratable.js'

const A = $Field(S.String)
const A_H = Hydratable(A)

describe('constructor', () => {
  test('returns sub type of what is given', () => {
    Ts.assertSub<S.Struct<any>>()(Hydratable(A))
  })
  test.todo('can wrap union')
  test('captures empty config', () => {
    const A_H = Hydratable(A)
    const config = getConfig(A_H)
    Ts.assertExact<readonly []>()(config)
    expect(config).toEqual([])
  })
  test('captures empty config', () => {
    const A_H = Hydratable(A)
    const config = getConfig(A_H)
    Ts.assertExact<readonly []>()(config)
    expect(config).toEqual([])
  })
  test('captures single key config', () => {
    const A_H = Hydratable(A, { keys: ['x'] })
    const config = getConfig(A_H)
    Ts.assertExact<readonly ['x']>()(config)
    expect(config).toEqual(['x'])
  })
  test('captures single key config', () => {
    const A_H = Hydratable(A, { keys: ['x'] })
    const config = getConfig(A_H)
    Ts.assertExact<readonly ['x']>()(config)
    expect(config).toEqual(['x'])
  })
})

describe('<instance>', () => {
  describe('.makeDehydrated()', () => {
    test('no keys', () => {
      const AH = Hydratable(A)
      const dehydrated = AH.makeDehydrated()
      Ts.assertExact<{ _tag: 'A'; _dehydrated: true }>()(dehydrated)
      expect(dehydrated).toEqual({ _tag: 'A', _dehydrated: true })
      // @ts-expect-error no keys to give
      AH.makeDehydrated({})
    })

    test('single key', () => {
      const AH = Hydratable(A, { keys: ['x'] })
      const dehydrated = AH.makeDehydrated({ x: 'x' })
      expect(dehydrated).toEqual({ _tag: 'A', _dehydrated: true, x: 'x' })
    })

    test('multi key', () => {
      const AH = Hydratable($Fields({ x: S.String, y: S.String }), { keys: ['x', 'y'] })
      const dehydrated = AH.makeDehydrated({ x: 'x', y: 'y' })
      expect(dehydrated).toEqual({ _tag: 'A', _dehydrated: true, x: 'x', y: 'y' })
      // @ts-expect-error missing required
      AH.makeDehydrated()
      // @ts-expect-error missing required
      AH.makeDehydrated({})
      // @ts-expect-error missing required
      AH.makeDehydrated({ x: '' })
      // @ts-expect-error excess properties
      AH.makeDehydrated({ x: '', y: '', z: '' })
    })

    test.todo('encoded key')
  })

  describe('.dehydrate()', () => {
    test('dehydrates a hydrated value', () => {
      const a = A_H.make({ x: 'x' })
      const dehydrated = A_H.dehydrate(a)
      expect(dehydrated).toEqual({ _tag: 'A', x: 'x', _dehydrated: true })
    })

    test('passes through an already dehydrated value', () => {
      const a = A_H.make({ x: 'x' })
      const dehydrated = A_H.dehydrate(a)
      const dehydratedCopy = { ...dehydrated }
      // @ts-expect-error
      const dehydrated2 = A_H.dehydrate(dehydrated)
      expect(dehydrated2).toBe(dehydrated)
      expect(dehydrated2).toEqual(dehydratedCopy)
    })
  })
})
