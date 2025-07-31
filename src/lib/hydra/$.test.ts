import { Ar, Hy, Num, Op, St, Str, Tst, Un } from '#lib/hydra/$.test.fixture'
import { EffectKit } from '#lib/kit-temp/$$'
import { Ts } from '@wollybeard/kit'
import { Effect, Schema as S } from 'effect'
import { describe, expect, test } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import { Hydra as H } from './$.js'

const A = Tst('A', { n: Num })
const HydratableA = Hy(A, { keys: ['x'] })
const B = Tst('B', { s: Str })
const HydratableB = Hy(B, { keys: ['s'] })

const None = St({ x: Str })
const Container = St({ item: HydratableA })
const ContainerArray = St({ items: Ar(HydratableA) })
const MultiContainerNested = St({ container: Container, directItem: HydratableB })
const UnionSchema = Un(HydratableA, HydratableB)

describe('Hydra.Hydratable()', () => {
  test('returns sub type of what is given', () => {
    Ts.assertSub<S.Struct<any>>()(Hy(A))
  })

  const makeConfig = H.Hydratable$.HydratableConfigStruct.make

  // dprint-ignore
  Test.each<{
    options?: Parameters<typeof Hy>[1]
    expectedConfig: H.Hydratable$.Config
  }>([
    { name: 'empty config',        options: undefined,       expectedConfig: makeConfig({ uniqueKeys: [] }) },
    { name: 'empty config 2',      options: undefined,       expectedConfig: makeConfig({ uniqueKeys: [] }) },
    { name: 'single key config',   options: { keys: ['x'] }, expectedConfig: makeConfig({ uniqueKeys: ['x'] }) },
    { name: 'single key config 2', options: { keys: ['x'] }, expectedConfig: makeConfig({ uniqueKeys: ['x'] }) },
    { name: 'can wrap union', todo:true },
  ], ({ options, expectedConfig }) => {
    const A_H = options ? Hy(A, options) : Hy(A)
    const config = H.Hydratable$.getConfigOrThrow(A_H)
    expect(config).toEqual(expectedConfig)
  })
})

// dprint-ignore
Test.suite<{
  hydratables: H.Hydratable[]
  root: S.Schema.Any
}>('Hydra.Hydratable$.buildSchemaIndex() indexes hydratable schemas found at or in given schema', [
  { name: 'direct',               root: HydratableA,                   hydratables: [HydratableA]  },
  { name: 'in struct property',   root: Container,                     hydratables: [HydratableA] },
  { name: 'multiple, nested',     root: MultiContainerNested,          hydratables: [HydratableA, HydratableB] },
  { name: 'in array',             root: ContainerArray,                hydratables: [HydratableA] },
  { name: 'in union',             root: UnionSchema,                   hydratables: [HydratableA, HydratableB] },
  { name: 'none',                 root: None,                          hydratables: [] },
  { name: 'in optional property', root: St({ x: Op(HydratableA) }),    hydratables: [HydratableA] },
], ({ root, hydratables = [] }) => {
  const schemaIndex = H.Hydratable$.buildASTIndex(root)
  expect(schemaIndex.size).toBe(hydratables.length)
  for (const hydratableSchema of hydratables) {
    const tag = EffectKit.Schema.TaggedStruct.getTagOrThrow(hydratableSchema)
    // Preliminary check that the tag is correct
    expect(schemaIndex.has(tag)).toBe(true)
    // Check that we get the exact same AST instance
    const indexedAST = schemaIndex.get(tag)
    expect(indexedAST).toBe(hydratableSchema.ast)
  }
})

const Child = Hy(Tst('Child', { id: Str, name: Str }), { keys: ['id'] })
const Product = Hy(Tst('Product', { sku: Str, price: Num }), { keys: ['sku'] })

// dprint-ignore
Test.suite<{
  rootSchema: S.Schema.Any
  testData: object
  expected: { size: number; keys: string[] }
}>('bridge.importFromMemory', [
    {
      name:              'non-hydratable root with hydratable children',
      rootSchema:        Tst('Root', { title: Str, children: Ar(Child) }),
      testData:          { _tag: 'Root', title: 'Test Root', children: [{ _tag: 'Child', id: '1', name: 'Child One' }, { _tag: 'Child', id: '2', name: 'Child Two' }] },
      expected:          {size:2, keys: ['Child!id@1', 'Child!id@2']},
    },
    {
      name:              'hydratable root with hydratable children',
      rootSchema:        Hy(Tst('Container', { id: Str, items: Ar(Product) }), { keys: ['id'] }),
      testData:          { _tag: 'Container', id: 'c1', items: [{ _tag: 'Product', sku: 'ABC', price: 10 }, { _tag: 'Product', sku: 'DEF', price: 20 }] },
      expected: {size:3, keys: ['Container!id@c1', 'Container!id@c1___Product!sku@ABC', 'Container!id@c1___Product!sku@DEF']},
    },
    {
      name:              'deeply nested hydratables',
      rootSchema:        St({ level1: St({ level2: St({ item: Child }) }) }),
      testData:          { level1: { level2: { item: { _tag: 'Child', id: 'deep', name: 'Deep Child' } } } },
      expected: {size:1, keys: ['Child!id@deep']},
    },
    {
      name:              'empty arrays',
      rootSchema:        Tst('Empty', { items: Ar(Child) }),
      testData:          { _tag: 'Empty', items: [] },
      expected: {size:0, keys: []},
    },
    {
      name:              'no hydratables',
      rootSchema:        St({ plain: Str, data: Num }),
      testData:          { plain: 'hello', data: 42 },
      expected: {size:0, keys: []},
    },
  ], async ({ rootSchema, testData, expected }) => {
  const bridge = H.Bridge.makeMake(rootSchema)({})
  bridge.importFromMemory(testData)
  expect(bridge.index.root).toBe(testData)
  expect(bridge.index.fragments.size).toBe(expected.size)
  for (const key of expected.keys) {
    expect(bridge.index.fragments.has(key)).toBe(true)
  }

  // Test view() after import - should return hydrated data equal to original
  const viewed = await Effect.runPromise(
    Effect.provide(
      bridge.view(),
      H.Io.Memory({ initialFiles: new Map() }),
    )
  )
  expect(viewed).toEqual(testData)
})

// dprint-ignore
Test.suite<{
  rootSchema: S.Schema.Any
  rootData: object
}>('bridge.clear() resets index to empty state', [
  {
    name: 'root and children',
    rootSchema: Hy(Tst('Container', { id: Str, items: Ar(Product) }), { keys: ['id'] }),
    rootData: { _tag: 'Container', id: 'c1', items: [{ _tag: 'Product', sku: 'ABC', price: 10 }] },
  },
  {
    name: 'root',
    rootSchema: Tst('Root', { children: Ar(Child) }),
    rootData: { _tag: 'Root', children: [{ _tag: 'Child', id: '1', name: 'Child One' }] },
  },
  {
    name: 'no hydratables',
    rootSchema: St({ data: Str }),
    rootData: { data: 'test' },
  },
], async ({ rootSchema, rootData }) => {
  const bridge = H.Bridge.makeMake(rootSchema)({})
  bridge.importFromMemory(rootData)

  // Verify hasImported is set after import
  expect(bridge.index.hasImported).toBe(true)

  const exported = bridge.exportToMemory()
  const memoryIO = H.Io.Memory({ initialFiles: new Map(exported) })

  await Effect.runPromise(Effect.provide(bridge.clear(), memoryIO))

  // Verify cleared state
  expect(bridge.index.root).toBe(null)
  expect(bridge.index.fragments.size).toBe(0)
  expect(bridge.index.hasImported).toBe(false)

  // Verify files were removed from Memory IO
  const remainingFiles = await Effect.runPromise(
    Effect.provide(
      Effect.gen(function*() {
        const io = yield* H.Io.IO
        return yield* io.list('.')
      }),
      memoryIO,
    )
  )

  // All files should be removed
  expect(remainingFiles).toEqual([])
})
