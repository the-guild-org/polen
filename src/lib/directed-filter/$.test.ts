import { S } from '#dep/effect'
import { describe, expect, test } from 'vitest'
import { DirectedFilter } from './$.js'

describe('create', () => {
  test('returns Union and member schemas', () => {
    const F = DirectedFilter.create(S.String)
    expect(F).toHaveProperty('Union')
    expect(F).toHaveProperty('Allow')
    expect(F).toHaveProperty('Deny')
    expect(F.Allow.make({ items: ['a'] })._tag).toBe('DirectedFilterAllow')
    expect(F.Deny.make({ items: ['b'] })._tag).toBe('DirectedFilterDeny')
  })
})

describe('constructor functions', () => {
  test('allow creates DirectedFilterAllow', () => {
    const filter = DirectedFilter.allow(['a', 'b'])
    expect(filter._tag).toBe('DirectedFilterAllow')
    expect(filter.items).toEqual(['a', 'b'])
  })

  test('deny creates DirectedFilterDeny', () => {
    const filter = DirectedFilter.deny(['c', 'd'])
    expect(filter._tag).toBe('DirectedFilterDeny')
    expect(filter.items).toEqual(['c', 'd'])
  })

  test('AllowAll is DirectedFilterAllowAll', () => {
    expect(DirectedFilter.AllowAll._tag).toBe('DirectedFilterAllowAll')
  })

  test('denyAll is DirectedFilterDenyAll', () => {
    expect(DirectedFilter.DenyAll._tag).toBe('DirectedFilterDenyAll')
  })
})

describe('fromOnlyExclude', () => {
  test.for([
    { only: ['a', 'b'], exclude: undefined, expected: { _tag: 'DirectedFilterAllow', items: ['a', 'b'] } },
    { only: undefined, exclude: ['c', 'd'], expected: { _tag: 'DirectedFilterDeny', items: ['c', 'd'] } },
    { only: ['a'], exclude: ['b'], expected: { _tag: 'DirectedFilterAllow', items: ['a'] } }, // only wins
    { only: undefined, exclude: undefined, expected: { _tag: 'DirectedFilterAllowAll' } },
    { only: [], exclude: [], expected: { _tag: 'DirectedFilterAllowAll' } },
    { only: [], exclude: undefined, expected: { _tag: 'DirectedFilterAllowAll' } },
  ])('$only/$exclude -> $expected', ({ only, exclude, expected }) => {
    expect(DirectedFilter.fromOnlyExclude(only, exclude)).toEqual(expected)
  })
})

describe('filter', () => {
  const items = ['a', 'b', 'c', 'd']

  test.for([
    { filter: { _tag: 'DirectedFilterAllow', items: ['a', 'c'] }, expected: ['a', 'c'] },
    { filter: { _tag: 'DirectedFilterDeny', items: ['b', 'd'] }, expected: ['a', 'c'] },
    { filter: { _tag: 'DirectedFilterAllow', items: ['a', 'z'] }, expected: ['a'] }, // non-existent
    { filter: { _tag: 'DirectedFilterDeny', items: ['x', 'y'] }, expected: items }, // non-existent
    { filter: { _tag: 'DirectedFilterAllow', items: [] }, expected: [] },
    { filter: { _tag: 'DirectedFilterDeny', items: [] }, expected: items },
    { filter: { _tag: 'DirectedFilterAllowAll' }, expected: items },
    { filter: { _tag: 'DirectedFilterDenyAll' }, expected: [] },
  ])('$filter._tag with items $filter.items -> $expected', ({ filter, expected }) => {
    expect(DirectedFilter.filter(filter as any)(items)).toEqual(expected)
  })
})

describe('filterBy', () => {
  const people = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 30 },
  ]

  test.for([
    {
      filter: { _tag: 'DirectedFilterAllow', items: [30] },
      getter: (p: any) => p.age,
      expected: [people[0], people[2]],
    },
    {
      filter: { _tag: 'DirectedFilterDeny', items: ['Bob'] },
      getter: (p: any) => p.name,
      expected: [people[0], people[2]],
    },
    {
      filter: { _tag: 'DirectedFilterAllowAll' },
      getter: (p: any) => p.age,
      expected: people,
    },
    {
      filter: { _tag: 'DirectedFilterDenyAll' },
      getter: (p: any) => p.name,
      expected: [],
    },
  ])('filters by custom getter', ({ filter, getter, expected }) => {
    expect(DirectedFilter.filterBy(filter as any)(getter)(people)).toEqual(expected)
  })

  test('supports partial application', () => {
    const filter = { _tag: 'DirectedFilterAllow' as const, items: [1, 3] }
    const filterById = DirectedFilter.filterBy(filter)((p: any) => p.id)
    expect(filterById(people).map(p => p.id)).toEqual([1, 3])
    expect(filterById([{ id: 5 }])).toEqual([])
  })
})

describe('filterByProperty', () => {
  const products = [
    { id: 'p1', category: 'Electronics', price: 1000 },
    { id: 'p2', category: 'Media', price: 20 },
    { id: 'p3', category: 'Electronics', price: 800 },
  ]

  test.for([
    {
      filter: { _tag: 'DirectedFilterAllow', items: ['Electronics'] },
      prop: 'category',
      expected: [products[0], products[2]],
    },
    {
      filter: { _tag: 'DirectedFilterDeny', items: ['p2'] },
      prop: 'id',
      expected: [products[0], products[2]],
    },
    {
      filter: { _tag: 'DirectedFilterAllow', items: [20, 800] },
      prop: 'price',
      expected: [products[1], products[2]],
    },
  ])('filters by property $prop', ({ filter, prop, expected }) => {
    expect(DirectedFilter.filterByProperty(filter as any)(prop as any)(products)).toEqual(expected)
  })
})

describe('type guards', () => {
  const allow = { _tag: 'DirectedFilterAllow' as const, items: ['a'] }
  const deny = { _tag: 'DirectedFilterDeny' as const, items: ['b'] }
  const allowAll = { _tag: 'DirectedFilterAllowAll' as const }
  const denyAll = { _tag: 'DirectedFilterDenyAll' as const }

  test('isAllow', () => {
    expect(DirectedFilter.isAllow(allow)).toBe(true)
    expect(DirectedFilter.isAllow(deny)).toBe(false)
    expect(DirectedFilter.isAllow(allowAll)).toBe(false)
    expect(DirectedFilter.isAllow(denyAll)).toBe(false)
  })

  test('isDeny', () => {
    expect(DirectedFilter.isDeny(allow)).toBe(false)
    expect(DirectedFilter.isDeny(deny)).toBe(true)
    expect(DirectedFilter.isDeny(allowAll)).toBe(false)
    expect(DirectedFilter.isDeny(denyAll)).toBe(false)
  })

  test('isAllowAll', () => {
    expect(DirectedFilter.isAllowAll(allow)).toBe(false)
    expect(DirectedFilter.isAllowAll(deny)).toBe(false)
    expect(DirectedFilter.isAllowAll(allowAll)).toBe(true)
    expect(DirectedFilter.isAllowAll(denyAll)).toBe(false)
  })

  test('isDenyAll', () => {
    expect(DirectedFilter.isDenyAll(allow)).toBe(false)
    expect(DirectedFilter.isDenyAll(deny)).toBe(false)
    expect(DirectedFilter.isDenyAll(allowAll)).toBe(false)
    expect(DirectedFilter.isDenyAll(denyAll)).toBe(true)
  })
})
