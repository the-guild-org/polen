import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { objFilter, ObjOmit, ObjPick, objPolicyFilter, spreadShallow } from './kit-temp.js'

describe('objPolicyFilter', () => {
  const testObj = { a: 1, b: 2, c: 3, d: 4 }

  test('allow mode picks specified keys', () => {
    expect(objPolicyFilter('allow', testObj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
    expect(objPolicyFilter('allow', testObj, [])).toEqual({})
    expect(objPolicyFilter('allow', testObj, ['a', 'z'] as any)).toEqual({ a: 1 })
  })

  test('deny mode omits specified keys', () => {
    expect(objPolicyFilter('deny', testObj, ['a', 'c'])).toEqual({ b: 2, d: 4 })
    expect(objPolicyFilter('deny', testObj, [])).toEqual(testObj)
    expect(objPolicyFilter('deny', testObj, ['z'] as any)).toEqual(testObj)
  })

  test('preserves undefined values', () => {
    const obj = { a: 1, b: undefined, c: 3 }
    expect(objPolicyFilter('allow', obj, ['a', 'b'])).toEqual({ a: 1, b: undefined })
  })
})

describe('objFilter', () => {
  const testObj = { a: 1, b: 2, c: 3, d: 4 }

  test('filters by predicates', () => {
    // By value
    expect(objFilter(testObj, (k, v) => v > 2)).toEqual({ c: 3, d: 4 })

    // By key
    expect(objFilter(testObj, k => k === 'a' || k === 'c')).toEqual({ a: 1, c: 3 })

    // By full object context
    expect(objFilter(testObj, (k, v, obj) => {
      const avg = Object.values(obj).reduce((a, b) => a + b, 0) / Object.keys(obj).length
      return v < avg
    })).toEqual({ a: 1, b: 2 })
  })

  test('edge cases', () => {
    expect(objFilter(testObj, () => false)).toEqual({})
    expect(objFilter(testObj, () => true)).toEqual(testObj)
    expect(objFilter({}, () => true)).toEqual({})
  })
})

describe('ObjPick and ObjOmit', () => {
  test('are aliases for objPolicyFilter', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const keys = ['a', 'c'] as const

    expect(ObjPick(obj, keys)).toEqual(objPolicyFilter('allow', obj, keys))
    expect(ObjOmit(obj, keys)).toEqual(objPolicyFilter('deny', obj, keys))
  })
})

describe('property-based tests', () => {
  test('objPolicyFilter allow/deny are complementary', () => {
    fc.assert(
      fc.property(
        fc.object(),
        fc.array(fc.string()),
        (obj, keys) => {
          const allowed = objPolicyFilter('allow', obj, keys)
          const denied = objPolicyFilter('deny', obj, keys)

          // Every key in obj is either in allowed or denied, never both
          Object.keys(obj).forEach(key => {
            const inAllowed = Object.prototype.hasOwnProperty.call(allowed, key)
            const inDenied = Object.prototype.hasOwnProperty.call(denied, key)
            expect(inAllowed).toBe(!inDenied)
          })

          // Combined they reconstruct the original object (only own properties)
          const reconstructed = { ...allowed, ...denied }
          const ownPropsObj = Object.keys(obj).reduce<any>((acc, key) => {
            acc[key] = obj[key]
            return acc
          }, {})
          expect(reconstructed).toEqual(ownPropsObj)
        },
      ),
    )
  })

  test('objFilter preserves values unchanged', () => {
    fc.assert(
      fc.property(
        fc.object(),
        (obj) => {
          const filtered = objFilter(obj, () => true)

          // Object.keys doesn't include __proto__, so we need to handle it specially
          const objWithoutProto = Object.keys(obj).reduce<any>((acc, key) => {
            acc[key] = obj[key]
            return acc
          }, {})

          expect(filtered).toEqual(objWithoutProto)

          // Values are the same reference
          Object.keys(filtered).forEach(key => {
            expect(filtered[key]).toBe(obj[key])
          })
        },
      ),
    )
  })

  test('objPolicyFilter is immutable', () => {
    fc.assert(
      fc.property(
        fc.object(),
        fc.array(fc.string()),
        fc.oneof(fc.constant('allow' as const), fc.constant('deny' as const)),
        (obj, keys, mode) => {
          const original = { ...obj }
          objPolicyFilter(mode, obj, keys)
          expect(obj).toEqual(original)
        },
      ),
    )
  })

  test('empty keys behavior', () => {
    fc.assert(
      fc.property(
        fc.object(),
        (obj) => {
          expect(objPolicyFilter('allow', obj, [])).toEqual({})
          expect(objPolicyFilter('deny', obj, [])).toEqual(obj)
        },
      ),
    )
  })
})

describe('mergeShallow', () => {
  test('merges objects while omitting undefined values', () => {
    const base = { a: 1, b: 2, c: 3 }
    const override = { b: undefined, c: 4, d: 5 }

    expect(spreadShallow(base, override)).toEqual({ a: 1, b: 2, c: 4, d: 5 })
  })

  test('handles multiple objects', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { b: undefined, c: 3 }
    const obj3 = { c: undefined, d: 4 }

    expect(spreadShallow(obj1, obj2, obj3)).toEqual({ a: 1, b: 2, c: 3, d: 4 })
  })

  test('handles empty objects', () => {
    expect(spreadShallow({}, {})).toEqual({})
    expect(spreadShallow({ a: 1 }, {})).toEqual({ a: 1 })
    expect(spreadShallow({}, { a: 1 })).toEqual({ a: 1 })
  })

  test('handles single object', () => {
    const obj = { a: 1, b: undefined, c: 3 }
    expect(spreadShallow(obj)).toEqual({ a: 1, c: 3 })
  })

  test('handles no objects', () => {
    expect(spreadShallow()).toEqual({})
  })

  test('handles undefined objects', () => {
    const obj = { a: 1, b: 2 }
    expect(spreadShallow(undefined, obj, undefined)).toEqual({ a: 1, b: 2 })
    expect(spreadShallow(obj, undefined)).toEqual({ a: 1, b: 2 })
    expect(spreadShallow(undefined, undefined)).toEqual({})
  })

  test('preserves null values', () => {
    const obj1 = { a: 1, b: null }
    const obj2 = { b: 2, c: null }
    expect(spreadShallow(obj1, obj2)).toEqual({ a: 1, b: 2, c: null })
  })

  test('preserves false and 0 values', () => {
    const obj1 = { a: true, b: 1 }
    const obj2 = { a: false, b: 0 }
    expect(spreadShallow(obj1, obj2)).toEqual({ a: false, b: 0 })
  })

  test('property-based: never includes undefined values', () => {
    fc.assert(
      fc.property(
        fc.array(fc.object({ withUndefined: true })),
        (objects) => {
          const result = spreadShallow(...objects)
          Object.values(result).forEach(value => {
            expect(value).not.toBe(undefined)
          })
        },
      ),
    )
  })

  test('property-based: later objects override earlier ones', () => {
    fc.assert(
      fc.property(
        fc.object(),
        fc.object(),
        fc.string(),
        fc.anything({ withUndefined: false }),
        (obj1, obj2, key, value) => {
          // Set the same key in both objects
          obj1[key] = 'first'
          obj2[key] = value

          const result = spreadShallow(obj1, obj2)
          expect(result[key]).toBe(value)
        },
      ),
    )
  })
})
