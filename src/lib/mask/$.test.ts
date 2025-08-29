import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import { Mask } from './$.js'

// dprint-ignore
Test.suite<{ options: any; expectedType: 'binary' | 'properties'; expectedMode?: 'allow' | 'deny'; expectedShow?: boolean; expectedProperties?: string[] }>('Mask.create', [
  { name: 'boolean true creates binary show mask',       options: true,                                        expectedType: 'binary',     expectedShow: true },
  { name: 'boolean false creates binary hide mask',      options: false,                                       expectedType: 'binary',     expectedShow: false },
  { name: 'array creates allow mode properties mask',    options: ['name', 'age'],                             expectedType: 'properties', expectedMode: 'allow', expectedProperties: ['name', 'age'] },
  { name: 'object with true values creates allow mode',  options: { name: true, age: true, password: false },  expectedType: 'properties', expectedMode: 'allow', expectedProperties: ['name', 'age'] },
  { name: 'object with false values creates deny mode',  options: { password: false, secret: false },          expectedType: 'properties', expectedMode: 'deny',  expectedProperties: ['password', 'secret'] },
], ({ options, expectedType, expectedMode, expectedShow, expectedProperties }) => {
  const mask = Mask.create(options)
  expect(mask.type).toBe(expectedType)
  
  if (expectedType === 'binary' && mask.type === 'binary') {
    expect(mask.show).toBe(expectedShow)
  }
  
  if (expectedType === 'properties' && mask.type === 'properties') {
    expect(mask.mode).toBe(expectedMode)
    expect(mask.properties).toEqual(expectedProperties)
  }
})

// dprint-ignore
Test.suite<{ data: any; maskOptions: any; shouldThrow?: boolean; expected?: any }>('Mask.apply', [
  { name: 'binary show mask returns data',               data: { a: 1 },                                 maskOptions: true,              expected: { a: 1 } },
  { name: 'binary hide mask returns undefined',          data: { a: 1 },                                 maskOptions: false,             expected: undefined },
  { name: 'allow mode filters properties',               data: { name: 'John', age: 30, password: 'secret' }, maskOptions: ['name', 'age'],    expected: { name: 'John', age: 30 } },
  { name: 'deny mode removes properties',                data: { name: 'John', age: 30, password: 'secret' }, maskOptions: { password: false }, expected: { name: 'John', age: 30 } },
  { name: 'properties mask throws for string',           data: 'string',                                 maskOptions: ['name'],          shouldThrow: true },
  { name: 'properties mask throws for number',           data: 123,                                      maskOptions: ['name'],          shouldThrow: true },
  { name: 'properties mask throws for null',             data: null,                                     maskOptions: ['name'],          shouldThrow: true },
], ({ data, maskOptions, shouldThrow, expected }) => {
  const mask = Mask.create(maskOptions)
  
  if (shouldThrow) {
    expect(() => Mask.apply(data as any, mask)).toThrow()
  } else {
    const result = Mask.apply(data, mask)
    if (expected === undefined) {
      expect(result).toBe(undefined)
    } else {
      expect(result).toEqual(expected)
    }
  }
})

// dprint-ignore
Test.suite<{ method: 'applyPartial' | 'applyExact'; data: any; maskOptions: any; expected: any }>('apply variants', [
  { name: 'applyPartial allows missing properties',      method: 'applyPartial', data: { name: 'John' },  maskOptions: ['name', 'age'], expected: { name: 'John' } },
  { name: 'applyPartial with empty object',              method: 'applyPartial', data: {},                maskOptions: ['name', 'age'], expected: {} },
  { name: 'applyExact with binary show mask',            method: 'applyExact',   data: 'hello',           maskOptions: true,             expected: 'hello' },
  { name: 'applyExact with binary hide mask',            method: 'applyExact',   data: 'hello',           maskOptions: false,            expected: undefined },
], ({ method, data, maskOptions, expected }) => {
  const mask = Mask.create(maskOptions)
  
  const result = method === 'applyPartial' 
    ? Mask.applyPartial(data, mask)
    : Mask.applyExact(data as any, mask)
    
  if (expected === undefined) {
    expect(result).toBe(undefined)
  } else {
    expect(result).toEqual(expected)
  }
})

describe('property-based tests', () => {
  test('binary masks - invariants', () => {
    fc.assert(
      fc.property(fc.anything(), (data) => {
        expect(Mask.apply(data, Mask.create(true))).toBe(data)
        expect(Mask.apply(data, Mask.create(false))).toBe(undefined)
      }),
    )
  })

  test('properties mask - allow mode filters correctly', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()),
        fc.array(fc.string(), { minLength: 1 }),
        (obj, keys) => {
          const mask = Mask.create(keys)
          const result = Mask.apply(obj as any, mask)
          const resultKeys = Object.keys(result as any)

          // Result contains only keys that were in both mask and object
          expect(resultKeys.every(key => keys.includes(key))).toBe(true)

          // All requested keys that are own properties of obj are in result
          keys.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              expect(result).toHaveProperty(key, (obj as any)[key])
            }
          })
        },
      ),
    )
  })

  test('properties mask - deny mode filters correctly', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()),
        fc.uniqueArray(fc.string(), { minLength: 1 }),
        (data, keysToRemove) => {
          const maskSpec = Object.fromEntries(keysToRemove.map(k => [k, false]))
          const mask = Mask.create(maskSpec)

          expect(mask.type).toBe('properties')
          if (mask.type !== 'properties') return
          expect(mask.mode).toBe('deny')

          const result = Mask.apply(data as any, mask)

          // Result should not have any of the denied keys
          keysToRemove.forEach(key => {
            expect(Object.prototype.hasOwnProperty.call(result, key)).toBe(false)
          })

          // Result should have all other keys from data
          Object.keys(data).forEach(key => {
            if (!keysToRemove.includes(key)) {
              expect(Object.prototype.hasOwnProperty.call(result, key)).toBe(true)
              expect((result as any)[key]).toBe((data as any)[key])
            }
          })
        },
      ),
    )
  })

  test('undefined values are preserved', () => {
    fc.assert(
      fc.property(
        fc.record({
          a: fc.oneof(fc.anything(), fc.constant(undefined)),
          b: fc.oneof(fc.anything(), fc.constant(undefined)),
          c: fc.oneof(fc.anything(), fc.constant(undefined)),
        }),
        fc.shuffledSubarray(['a', 'b', 'c'], { minLength: 1 }),
        (obj, keys) => {
          const result = Mask.apply(obj as any, Mask.create(keys))

          keys.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              expect(result).toHaveProperty(key)
              expect((result as any)[key]).toBe((obj as any)[key])
            }
          })
        },
      ),
    )
  })

  test('apply and applyPartial are consistent for complete data', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()),
        fc.array(fc.string(), { minLength: 1 }),
        (data, keys) => {
          const mask = Mask.create(keys)
          expect(Mask.apply(data as any, mask)).toEqual(Mask.applyPartial(data as any, mask))
        },
      ),
    )
  })

  test('non-objects throw with properties masks', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
        ),
        fc.array(fc.string(), { minLength: 1 }),
        (nonObject, keys) => {
          const mask = Mask.create(keys)
          expect(() => Mask.apply(nonObject as any, mask)).toThrow('Cannot apply properties mask to non-object data')
        },
      ),
    )
  })

  test('immutability invariants', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string(),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
          ),
        ),
        fc.oneof(
          fc.boolean(),
          fc.array(fc.string()),
          fc.dictionary(fc.string(), fc.boolean()),
        ),
        (data, maskOptions) => {
          const mask = Mask.create(maskOptions as any)
          const originalData = { ...data }
          const originalMask = JSON.parse(JSON.stringify(mask))

          try {
            Mask.apply(data as any, mask)
          } catch {
            // Ignore errors for invalid combinations
          }

          expect(data).toEqual(originalData)
          expect(mask).toEqual(originalMask)
        },
      ),
    )
  })
})
