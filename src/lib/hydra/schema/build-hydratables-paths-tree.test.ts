import { S } from '#lib/kit-temp/effect'
import { describe, expect, test } from 'vitest'
import * as Fx from '../$.test.fixture.js'
import { buildHydratablesPathsTree } from './build-hydratables-paths-tree.js'

// ============================================================================
// Test Fixtures
// ============================================================================

const segmentTemplates = {
  A: {
    tag: 'A',
    uniqueKeys: ['x'],
  },
  B: {
    tag: 'B',
    uniqueKeys: ['x', 'y'],
  },
  D: {
    tag: 'D',
    uniqueKeys: ['x'],
  },
  CatalogVersioned: {
    tag: 'CatalogVersioned',
    adt: 'Catalog',
    uniqueKeys: ['version'],
  },
}

describe('simple hydratable detection', () => {
  test('detects hydratable union AH', () => {
    const tree = buildHydratablesPathsTree(Fx.H.A.ast)

    expect(tree.hydratableSegmentTemplate).toBeDefined()
    expect(tree.hydratableSegmentTemplate).toEqual(segmentTemplates.A)
  })

  test('detects hydratable union BH with multiple keys', () => {
    const tree = buildHydratablesPathsTree(Fx.H.B.ast)

    expect(tree.hydratableSegmentTemplate).toBeDefined()
    expect(tree.hydratableSegmentTemplate).toEqual(segmentTemplates.B)
  })
})

describe('nested hydratables', () => {
  test('builds tree for struct with nested hydratable', () => {
    const AWithNestedB = S.TaggedStruct('A', { b: S.TaggedStruct('B', { x: S.Number }) })
    const tree = buildHydratablesPathsTree(AWithNestedB.ast)

    // C$A itself is hydratable
    expect(tree.hydratableSegmentTemplate).toBeDefined()
    expect(tree.hydratableSegmentTemplate?.tag).toBe('C')

    // It has children: x and a
    expect(tree.children.size).toBeGreaterThanOrEqual(2)
    expect(tree.children.has('x')).toBe(true)
    expect(tree.children.has('a')).toBe(true)

    const aTree = tree.children.get('a')!
    expect(aTree.hydratableSegmentTemplate).toBeDefined()
    expect(aTree.hydratableSegmentTemplate).toEqual(segmentTemplates.A)
  })

  // todo: support unions
  // test('builds tree for complex nested structure DH', () => {
  //   // Create a DH hydratable for testing
  //   const D_Dehydrated = S.TaggedStruct('D', { x: S.Number, _dehydrated: S.Literal(true) })
  //   const D_Hydrated = S.TaggedStruct('D', {
  //     x: S.Number,
  //     a: Fx.H.A,
  //     bs: S.Array(Fx.H.B),
  //   })
  //   const DH = Hydratable(
  //     S.Union(D_Dehydrated, D_Hydrated),
  //     { keys: { D: ['x'] } },
  //   )
  //   const tree = buildHydratablesPathsTree(DH.ast)

  //   // DH is hydratable
  //   expect(tree.hydratableSegmentTemplate).toBeDefined()
  //   expect(tree.hydratableSegmentTemplate).toEqual(segmentTemplates.D)

  //   // Check nested structure in hydrated member
  //   const dTree = tree.children.get('x')!
  //   expect(dTree).toBeDefined()

  //   const aTree = tree.children.get('a')!
  //   expect(aTree).toBeDefined()
  //   expect(aTree.hydratableSegmentTemplate).toBeDefined()

  //   const bsTree = tree.children.get('bs')!
  //   expect(bsTree).toBeDefined()

  //   // Array element should be marked
  //   const arrayTree = bsTree.children.get('[array]')!
  //   expect(arrayTree).toBeDefined()
  //   expect(arrayTree.isArrayElement).toBe(true)
  //   expect(arrayTree.hydratableSegmentTemplate).toBeDefined()
  // })
})

describe('circular references', () => {
  test('handles circular references with cache', () => {
    type A = { x: number; self?: A }
    const A = S.Struct({
      x: S.Number,
      self: S.optional(S.suspend((): S.Schema<A> => A as any)),
    })

    const tree = buildHydratablesPathsTree(A.ast)

    // Should not crash and should have proper structure
    expect(tree.children.size).toBe(2) // x and self
    expect(tree.children.has('x')).toBe(true)
    expect(tree.children.has('self')).toBe(true)

    // The self reference should point to the same tree (cached)
    const selfTree = tree.children.get('self')!
    expect(selfTree).toBeDefined()
  })
})

// todo: unoin suport needed
// describe('ADT detection', () => {
//   test.skip('detects ADT information from annotations', () => {
//     // Create a schema with ADT annotations
//     const CatalogVersioned = S.TaggedStruct('CatalogVersioned', {
//       version: S.String,
//     }).annotations({
//       adt: { name: 'Catalog' },
//     })

//     const CatalogVersionedDehydrated = S.TaggedStruct('CatalogVersioned', {
//       version: S.String,
//       _dehydrated: S.Literal(true),
//     }).annotations({
//       adt: { name: 'Catalog' },
//     })

//     const CatalogHydratable = Hydratable(
//       S.Union(CatalogVersionedDehydrated, CatalogVersioned),
//       { keys: { CatalogVersioned: ['version'] } },
//     )

//     const tree = buildHydratablesPathsTree(CatalogHydratable.ast)

//     expect(tree.hydratableSegmentTemplate).toBeDefined()
//     expect(tree.hydratableSegmentTemplate).toEqual(segmentTemplates.CatalogVersioned)
//   })
// })
