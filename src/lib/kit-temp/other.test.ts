import * as fc from 'fast-check'
import { expect, test } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import { objFilter, ObjOmit, ObjPick, objPolicyFilter, spreadShallow } from './other.js'

// dprint-ignore
Test.suite<{ mode: 'allow' | 'deny'; keys: string[]; expected: Record<string, any> }>('objPolicyFilter', [
  { name: 'allow mode picks specified keys',      mode: 'allow', keys: ['a', 'c'], expected: { a: 1, c: 3 } },
  { name: 'allow mode with empty keys',           mode: 'allow', keys: [],         expected: {} },
  { name: 'allow mode with non-existent key',     mode: 'allow', keys: ['a', 'z'], expected: { a: 1 } },
  { name: 'deny mode omits specified keys',       mode: 'deny',  keys: ['a', 'c'], expected: { b: 2, d: 4 } },
  { name: 'deny mode with empty keys',            mode: 'deny',  keys: [],         expected: { a: 1, b: 2, c: 3, d: 4 } },
  { name: 'deny mode with non-existent key',      mode: 'deny',  keys: ['z'],      expected: { a: 1, b: 2, c: 3, d: 4 } },
], ({ mode, keys, expected }) => {
  const testObj = { a: 1, b: 2, c: 3, d: 4 }
  expect(objPolicyFilter(mode, testObj, keys as any)).toEqual(expected)
})

test('objPolicyFilter preserves undefined values', () => {
  const obj = { a: 1, b: undefined, c: 3 }
  expect(objPolicyFilter('allow', obj, ['a', 'b'])).toEqual({ a: 1, b: undefined })
})

// dprint-ignore
Test.suite<{ testType: 'byValue' | 'byKey' | 'byContext' | 'allFalse' | 'allTrue' | 'emptyObj'; expected: Record<string, any> }>('objFilter', [
  { name: 'filters by value predicate',      testType: 'byValue',   expected: { c: 3, d: 4 } },
  { name: 'filters by key predicate',        testType: 'byKey',     expected: { a: 1, c: 3 } },
  { name: 'filters by full context',         testType: 'byContext', expected: { a: 1, b: 2 } },
  { name: 'returns empty when all false',    testType: 'allFalse',  expected: {} },
  { name: 'returns all when all true',       testType: 'allTrue',   expected: { a: 1, b: 2, c: 3, d: 4 } },
  { name: 'handles empty object',            testType: 'emptyObj',  expected: {} },
], ({ testType, expected }) => {
  const testObj = { a: 1, b: 2, c: 3, d: 4 }
  
  let result: any
  switch (testType) {
    case 'byValue':
      result = objFilter(testObj, (k, v) => v > 2)
      break
    case 'byKey':
      result = objFilter(testObj, k => k === 'a' || k === 'c')
      break
    case 'byContext':
      result = objFilter(testObj, (k, v, obj) => {
        const avg = Object.values(obj).reduce((a, b) => a + b, 0) / Object.keys(obj).length
        return v < avg
      })
      break
    case 'allFalse':
      result = objFilter(testObj, () => false)
      break
    case 'allTrue':
      result = objFilter(testObj, () => true)
      break
    case 'emptyObj':
      result = objFilter({}, () => true)
      break
  }
  
  expect(result).toEqual(expected)
})

test('ObjPick and ObjOmit are aliases for objPolicyFilter', () => {
  const obj = { a: 1, b: 2, c: 3 }
  const keys = ['a', 'c'] as const

  expect(ObjPick(obj, keys)).toEqual(objPolicyFilter('allow', obj, keys))
  expect(ObjOmit(obj, keys)).toEqual(objPolicyFilter('deny', obj, keys))
})

// Property-based tests
test('objPolicyFilter allow/deny are complementary', () => {
  fc.assert(
    fc.property(
      fc.object(),
      fc.array(fc.string()),
      (obj, keys) => {
        const allowed = objPolicyFilter('allow', obj, keys)
        const denied = objPolicyFilter('deny', obj, keys)

        // Every key in obj (own properties only) is either in allowed or denied, never both
        Object.keys(obj).forEach(key => {
          const inAllowed = Object.prototype.hasOwnProperty.call(allowed, key)
          const inDenied = Object.prototype.hasOwnProperty.call(denied, key)
          expect(inAllowed).toBe(!inDenied)
        })

        // Combined they reconstruct the original object's own properties
        const reconstructed = { ...allowed, ...denied }

        // Filter out inherited properties that may have been added from the keys
        const filteredReconstructed = Object.keys(reconstructed)
          .filter(key => Object.prototype.hasOwnProperty.call(obj, key))
          .reduce<any>((acc, key) => {
            acc[key] = (reconstructed as any)[key]
            return acc
          }, {})

        const ownPropsObj = Object.keys(obj).reduce<any>((acc, key) => {
          acc[key] = obj[key]
          return acc
        }, {})
        expect(filteredReconstructed).toEqual(ownPropsObj)
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

// dprint-ignore
Test.suite<{ testType: 'mergeBasic' | 'multipleObjects' | 'emptyObjects' | 'singleObject' | 'noObjects' | 'undefinedObjects' | 'nullValues' | 'falseAndZero'; objects?: any[]; expected: Record<string, any> }>('spreadShallow', [
  { name: 'merges objects while omitting undefined values', testType: 'mergeBasic',       objects: [{ a: 1, b: 2, c: 3 }, { a: 1, b: undefined, c: 4, d: 5 }],                                             expected: { a: 1, b: 2, c: 4, d: 5 } },
  { name: 'handles multiple objects',                       testType: 'multipleObjects', objects: [{ a: 1, b: 2 }, { a: 1, b: undefined, c: 3 }, { a: 1, b: 2, c: undefined, d: 4 }],                     expected: { a: 1, b: 2, c: 3, d: 4 } },
  { name: 'handles empty objects',                          testType: 'emptyObjects',    objects: [{}, {}],                                                                                                expected: {} },
  { name: 'merges empty with non-empty',                    testType: 'emptyObjects',    objects: [{ a: 1 }, {}],                                                                                          expected: { a: 1 } },
  { name: 'merges non-empty with empty',                    testType: 'emptyObjects',    objects: [{}, { a: 1 }],                                                                                          expected: { a: 1 } },
  { name: 'handles single object',                          testType: 'singleObject',    objects: [{ a: 1, b: undefined, c: 3 }],                                                                          expected: { a: 1, c: 3 } },
  { name: 'handles no objects',                             testType: 'noObjects',       objects: [],                                                                                                       expected: {} },
  { name: 'handles undefined objects in middle',            testType: 'undefinedObjects', objects: [undefined, { a: 1, b: 2 }, undefined],                                                                 expected: { a: 1, b: 2 } },
  { name: 'handles undefined at end',                       testType: 'undefinedObjects', objects: [{ a: 1, b: 2 }, undefined],                                                                            expected: { a: 1, b: 2 } },
  { name: 'handles all undefined',                          testType: 'undefinedObjects', objects: [undefined, undefined],                                                                                 expected: {} },
  { name: 'preserves null values',                          testType: 'nullValues',      objects: [{ a: 1, b: null }, { a: 1, b: 2, c: null }],                                                           expected: { a: 1, b: 2, c: null } },
  { name: 'preserves false and 0 values',                   testType: 'falseAndZero',    objects: [{ a: true, b: 1 }, { a: false, b: 0 }],                                                                expected: { a: false, b: 0 } },
], ({ objects, expected }) => {
  const result = spreadShallow<any>(...(objects || []))
  expect(result).toEqual(expected)
})

test('property-based: never includes undefined values', () => {
  fc.assert(
    fc.property(
      fc.array(fc.dictionary(fc.string(), fc.option(fc.anything()))),
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
      fc.string().filter(k => k !== '__proto__' && k !== 'constructor' && k !== 'prototype'),
      fc.anything().filter(v => v !== undefined),
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

test('protects against prototype pollution', () => {
  // Test __proto__ pollution attempt
  const maliciousObj = { '__proto__': { polluted: true } } as any
  const normalObj = { safe: 'value' }

  const result = spreadShallow(normalObj, maliciousObj)

  // The result should not have __proto__ key
  expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false)

  // The Object prototype should not be polluted
  expect((Object.prototype as any).polluted).toBeUndefined()

  // Test constructor pollution attempt
  const constructorObj = { constructor: { polluted: true } } as any
  const result2 = spreadShallow(normalObj, constructorObj)
  expect(Object.prototype.hasOwnProperty.call(result2, 'constructor')).toBe(false)

  // Test prototype pollution attempt
  const prototypeObj = { prototype: { polluted: true } } as any
  const result3 = spreadShallow(normalObj, prototypeObj)
  expect(Object.prototype.hasOwnProperty.call(result3, 'prototype')).toBe(false)
})
